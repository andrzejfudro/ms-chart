let ENVIRONMENT;
let _data;
getRequest('/schema.json').then(response => {
	const qlikSchema = JSON.parse(response);
	getRequest('/environment.json').then(env => {
		ENVIRONMENT = JSON.parse(env);
		const session = enigma.create({
			url: ENVIRONMENT.qlikUrl,
			schema: qlikSchema,
		});
		session.open().then(global => {
			global.openDoc(ENVIRONMENT.qlikApp).then(app => {
				// TABLE
				const def = {
                    qInfo: {
                        qType: 'ref-list'
                    },
                    qListObjectDef: {
                        qDef: { qFieldDefs: ['Origin Country'] },
                        qInitialDataFetch: [
                            { qTop: 35, qLeft: 0, qWidth: 1, qHeight: 100 }
                        ]
                    },
					qHyperCubeDef: {
						qDimensions: [
							{ qDef: { qFieldDefs: ['Year'] } },
						],
						qMeasures: [
							{ qDef: { qDef: 'Sum([Total decisions])', qLabel: 'Total decisions' } },
						],
						qInitialDataFetch: [
							{ qTop: 35, qLeft: 0, qWidth: 2, qHeight: 100 },
						],
					},
				};
                app.createSessionObject(def).then(model => {
                    _model = model;
                    renderList();
					renderLinechart();
                    model.addListener('changed', onChange);
					model.getLayout().then(layout => {
						_data = layout.qHyperCube.qDataPages[0].qMatrix;
						renderLinechart();
					});
                })
			})
		})
	})
});

function onChange() {
	renderList();
	removeLinechart();
	renderLinechart();
}

function renderList() {
	_model.getLayout().then(layout => {
		let html = `
			<div class="table-container">
				<div class="table-title">
					${layout.qListObject.qDimensionInfo.qFallbackTitle}
				</div>
				<div class="table-content">
				${layout.qListObject.qDataPages[0].qMatrix.map((row) =>
				`${row.map((cell) =>
					`<div class="table-row state-${cell.qState}" onclick="selectOriginCountry(${cell.qElemNumber})">${cell.qText}</div>`).join('')}
			 	`).join('')}
				</div>
			</div>
		`;
		document.getElementById('table-container').innerHTML = html;
		_data = layout.qHyperCube.qDataPages[0].qMatrix;
		console.log(layout);
	});
}

function selectOriginCountry (elemNum) {
	_model.selectListObjectValues('/qListObjectDef', [elemNum], true)
}

function getRequest (url) {
	return new Promise((resolve) => {
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function () {
			if (this.readyState === 4 && this.status === 200) {
				resolve(xhr.responseText)
			}
		};
		xhr.open('GET', url, true);
		xhr.send();
	});
}

function renderLinechart() {
	const data = _data;

	if (!data) {
		return;
	}

	data.splice(-1,1);

	const margin = { top: 50, right: 50, bottom: 50, left: 100 };
	const width = window.innerWidth - margin.left - margin.right - 250;
	const height = window.innerHeight - margin.top - margin.bottom;

	// Year
	const xScale = d3.scaleBand()
		.domain(data.map(item => item[0].qText))
		.range([0, width]);

	// Number of decisions
	const qNumArray = data.map(item => item[1].qNum);
	const yScale = d3.scaleLinear()
		.domain([Math.min(...qNumArray), Math.max(...qNumArray)])
		.range([height, 0]);

	const line = d3.line()
		.x(function(d) { return xScale(d[0].qText); })
		.y(function(d) { return yScale(d[1].qNum); })
		.curve(d3.curveMonotoneX);

	const svg = d3.select("body").select("svg")
		.attr("width", width + margin.left + margin.right)
		.attr("height", height + margin.top + margin.bottom)
		.append("g")
		.attr('class', 'main-group')
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	const axisBottom = d3.axisBottom(xScale);

	svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + height + ")")
		.call(axisBottom);

	svg.append("g")
		.attr("class", "y axis")
		.call(d3.axisLeft(yScale).ticks(5));

	svg.append("path")
		.datum(data)
		.attr("class", "line")
		.attr("d", line);

	svg.selectAll(".dot")
		.data(data)
		.enter().append("circle")
		.attr("class", "dot")
		.attr("cx", function(d) { return xScale(d[0].qText) })
		.attr("cy", function(d) { return yScale(d[1].qNum) })
		.attr("r", 5);
}

function removeLinechart() {
	d3.select("body").select("svg").select('.main-group').remove();
}

function onResize() {
	removeLinechart();
	renderLinechart();
}
