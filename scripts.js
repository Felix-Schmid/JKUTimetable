let jkudata = null

/** fetch data from jkuroomsearch and create table */
function init() {
	fetch("https://jkuroomsearch.app/data/index.json")
		.then((response) => response.json())
		.then(data => { jkudata = data; createTable() })
}

/** create the main time table (unfilled) */
function createTable() {
	const body = document.body, tbl = document.createElement('table')
	tbl.style.border = '1px solid black'
	
	const buildings = {}
	
	// sort rooms into buildings
	for (room in jkudata.rooms) {
		const r = jkudata.rooms[room]
		const bNo = r.building
		
		if (buildings[bNo] == undefined) {
			buildings[bNo] = []
		}
		buildings[bNo].push(r)
	}
	
	// add rows for each room
	for (b in buildings) {
		// add special building header row
		const tr = tbl.insertRow()
		const td = tr.insertCell()
		const str = document.createElement("strong")
		str.appendChild(document.createTextNode(jkudata.buildings[b].name))
		td.appendChild(str)
		td.style.border = '1px solid black'
		
		// add room rows for this building
		for (r in buildings[b]) {
			const tr = tbl.insertRow()
			const td = tr.insertCell()
			const rm = buildings[b][r]
			td.appendChild(document.createTextNode(`${rm.name} (${rm.capacity})`))
			td.style.border = '1px solid black'
		}
	}
	body.appendChild(tbl)
}
