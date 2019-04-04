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
				
			})
		})
	})
})

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
