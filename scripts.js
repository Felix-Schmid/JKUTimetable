let jkudata = null
const pauseStarts = new Set([600, 705, 810, 915, 1020, 1125, 1215, 1320])
const startTime = 510
const endTime = 1335
const timeStep = 15

/** fetch data from jkuroomsearch and create table */
function init() {
	fetch("https://jkuroomsearch.app/data/index.json")
		.then((response) => response.json())
		.then(data => { jkudata = data; createTable() })
}

/** create the main time table */
function createTable() {
	const body = document.body, tbl = document.createElement('table')
	const buildings = {}
	
	// sort rooms into buildings
	for (room in jkudata.rooms) {
		const r = jkudata.rooms[room]
		const bNo = r.building
		
		if (buildings[bNo] == undefined) {
			buildings[bNo] = {}
		}
		buildings[bNo][room] = r
	}
	
	// add header row
	const tr = tbl.insertRow()
	const td = tr.insertCell()
	const str = document.createElement("strong")
	str.appendChild(document.createTextNode("8"))
	td.appendChild(str)
	for (i = startTime; i < endTime; i += timeStep) {
		const td = tr.insertCell()
		if (i % 60 == 0) {
			const str = document.createElement("strong")
			str.appendChild(document.createTextNode(i / 60))
			td.appendChild(str)
		} else {
			td.appendChild(document.createTextNode(i % 60))
		}
	}
	
	// add rows for each room
	for (b in buildings) {
		// add special building header row
		const tr = tbl.insertRow()
		const td = tr.insertCell()
		const str = document.createElement("strong")
		str.appendChild(document.createTextNode(jkudata.buildings[b].name))
		td.appendChild(str)
		
		// add room rows for this building
		for (r in buildings[b]) {
			const tr = tbl.insertRow()
			const td = tr.insertCell()
			const rm = buildings[b][r]
			td.appendChild(document.createTextNode(`${rm.name} (${rm.capacity})`))
			
			for (i = startTime; i < endTime; i += timeStep) {
				const td = tr.insertCell()
				
				if (!isAvailable(r, i, "2024-01-08")) { // TODO: hardcoded for now...
					const div = document.createElement("div")
					td.appendChild(div)
					div.classList.add("unavailable")
				}
			}
		}
	}
	body.appendChild(tbl)
}

function isAvailable(room, time, date) {
	//if (pauseStarts.has(time)) {
	//	return true;
	//}
	const day = jkudata.available[date]
	
	for (slot in day[room]) {
		if (time >= day[room][slot][0] && time < day[room][slot][1]) {
			return true;
		}
	}
	return false;
}
