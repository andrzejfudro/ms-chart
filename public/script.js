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
				const def3 = {
					qInfo: {
						qType: 'ms-chart',
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

				app.createSessionObject(def3).then(model => {
					model.getLayout().then(layout => {
						_data = layout.qHyperCube.qDataPages[0].qMatrix;
						renderLinechart();
					});
				});
			});
		});
	});
});

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
	const width = window.innerWidth - margin.left - margin.right;
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

renderLinechart();

function onResize() {
	removeLinechart();
	renderLinechart();
}
