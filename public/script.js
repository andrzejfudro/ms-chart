let ENVIRONMENT
getRequest('/schema.json').then(response => {
	const qlikSchema = JSON.parse(response)
	getRequest('/environment.json').then(env => {
		ENVIRONMENT = JSON.parse(env)
		const session = enigma.create({
			url: ENVIRONMENT.qlikUrl,
			schema: qlikSchema
		})
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
                            { qTop: 0, qLeft: 0, qWidth: 1, qHeight: 10 }
                        ]
                    }
				}

                app.createSessionObject(def).then(model => {
                    _model = model
                    renderList(_model)
                    model.addListener('changed', renderList.bind(null, _model))
                })
                function renderList (model) {
                    model.getLayout().then(layout => {
						let html = `<h5>${layout.qListObject.qDimensionInfo.qFallbackTitle}</h5>`;
						console.log('|||||||');
                        layout.qListObject.qDataPages[0].qMatrix.forEach(item => {
							console.log(item[0].qState);
                            html += `
                                <div class="state-${item[0].qState}" onclick=selectOriginCountry(${item[0].qElemNumber})>
                                    ${item[0].qText}
                                </div>
                            `
						})
						document.getElementById('table_container').innerHTML = html
                    })
                }
				// 
			})
		})
	})
})

function selectOriginCountry (elemNum) {
	_model.selectListObjectValues('/qListObjectDef', [elemNum], true)
}

function getRequest (url) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()
		xhr.onreadystatechange = function () {
			if (this.readyState === 4 && this.status === 200) {				
				resolve(xhr.responseText)
			}			
		}
		xhr.open('GET', url, true)
		xhr.send()
	})
}
