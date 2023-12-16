let jkudata = null
const buildings = {}
const startTime = 510
const endTime = 1335
const timeStep = 15

/** fetch data from jkuroomsearch and create table */
function init() {
	const today = new Date()
	document.getElementById("dayinput").valueAsDate = today
	const dateStr = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate()
	
	fetch("https://jkuroomsearch.app/data/index.json")
		.then((response) => response.json())
		.then(data => { jkudata = data; createTable(); selectDay(dateStr); })
}

/** create the main time table */
function createTable() {
	const tbl = document.createElement('table')
	tbl.id = "maintable"
	
	// group rooms into buildings
	for (room in jkudata.rooms) {
		const r = jkudata.rooms[room]
		const bNo = r.building
		
		if (buildings[bNo] == undefined) {
			buildings[bNo] = {}
		}
		buildings[bNo][room] = r
	}
	
	// add header row with time stamps
	const tr = tbl.createTHead().insertRow()
	const th = document.createElement("th")
	th.appendChild(document.createTextNode("8"))
	th.style.fontWeight = "bold"
	tr.appendChild(th)
	
	for (i = startTime; i < endTime; i += timeStep) {
		const th = tbl.createTHead()
		if (i % 60 == 0) {
			const th = document.createElement("th")
			th.appendChild(document.createTextNode(i / 60))
			tr.appendChild(th)
		} else {
			const small = document.createElement("small")
			small.appendChild(document.createTextNode(i % 60))
			const th = document.createElement("th")
			th.appendChild(small)
			tr.appendChild(th)
		}
	}
	
	// add rows for each room
	const tbody = tbl.createTBody()
	
	for (b in buildings) {
		// add special building header row
		const tr = tbody.insertRow()
		const th = document.createElement("th")
		tr.appendChild(th)
		const str = document.createElement("strong")
		str.appendChild(document.createTextNode(jkudata.buildings[b].name))
		th.appendChild(str)
		
		// add room rows for this building
		for (r in buildings[b]) {
			const tr = tbody.insertRow()
			const th = document.createElement("th")
			tr.appendChild(th)
			const rm = buildings[b][r]
			th.appendChild(document.createTextNode(`${rm.name} (${rm.capacity})`))
			
			for (i = startTime; i < endTime; i += timeStep) {
				const td = tr.insertCell()
				td.appendChild(document.createElement("div"))
			}
		}
	}
	document.body.appendChild(tbl)
}

function selectButtonClick() {
	const dayinput = document.getElementById("dayinput")
	selectDay(dayinput.value)
}

/** select the date for which the data should be shown (in "YYYY-MM-DD" format) */
function selectDay(date) {
	const title = document.getElementById("dataTitle")
	const hint = document.getElementById("dataHint")
	if (!date) {
		title.innerHTML = "Please select a day" // TODO: hide table...
		hint.innerHTML = ""
	} else if (!Object.hasOwn(jkudata.available, date)) {
		title.innerHTML = "No data for " + date // TODO: hide table...
		const start = jkudata.range.start.split("T")[0]
		const end = jkudata.range.end.split("T")[0]
		hint.innerHTML = "Available data ranges from " + start + " until " + end + "."
	} else {
		title.innerHTML = "Showing data for " + date
		hint.innerHTML = ""
		fillTable(date)
	}
}

/** fill the time table with availablility data for the specified day (in "YYYY-MM-DD" format) */
function fillTable(date) {
	const tbl = document.getElementById("maintable")
	let rowIdx = 1 // ignore header row
	for (b in buildings) {
		// skip building row
		rowIdx++
		
		// add room rows for this building
		for (r in buildings[b]) {
			let cellIdx = 1 // ignore first column
			
			for (i = startTime; i < endTime; i += timeStep) {
				const div = tbl.rows[rowIdx].cells[cellIdx].children[0]
				
				if (!isAvailable(r, i, date)) {
					div.classList.add("unavailable")
				} else {
					div.classList.remove("unavailable")
				}
				cellIdx++
			}
			rowIdx++
		}
	}
}

/** check if a given room is available at a given time and date */
function isAvailable(room, time, date) {
	const day = jkudata.available[date]
	
	if (Object.keys(day).length === 0) { // days with no slots are empty objects
		return true
	}
	for (slot in day[room]) {
		if (time >= day[room][slot][0] && time < day[room][slot][1]) {
			return true
		}
	}
	return false
}
