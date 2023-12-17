let jkudata = null
const buildings = {}
const usageCharts = {}
const startTime = 510
const endTime = 1335
const timeStep = 15

/** fetch data from jkuroomsearch and create table */
function init() {
	const today = new Date()
	document.getElementById("dayinput").valueAsDate = today
	const date = today.getFullYear() + "-" + (today.getMonth()+1) + "-" + today.getDate()
	
	fetch("https://jkuroomsearch.app/data/index.json")
		.then((response) => response.json())
		.then(data => {
			jkudata = data;
			createTable();
			createAndFillCapacityStats();
			createUsageStats();
			selectDay(date);
		})
		
	// TODO: system for lazy loading tabs...
		
	document.getElementById("defaultTab").click();
}

/** create the main time table */
function createTable() {
	const tbl = document.createElement('table')
	tbl.id = "maintable"
	
	// group rooms into buildings
	for (let room in jkudata.rooms) {
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
	
	for (let i = startTime; i < endTime; i += timeStep) {
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
	
	for (let b in buildings) {
		// add special building header row
		const tr = tbody.insertRow()
		const th = document.createElement("th")
		tr.appendChild(th)
		const str = document.createElement("strong")
		str.appendChild(document.createTextNode(jkudata.buildings[b].name))
		th.appendChild(str)
		
		// add room rows for this building
		for (let r in buildings[b]) {
			const rm = buildings[b][r]
			
			const tr = tbody.insertRow()
			const th = document.createElement("th")
			tr.appendChild(th)
			
			const span = document.createElement("span")
			span.appendChild(document.createTextNode(rm.name))
			th.appendChild(span)
			
			const img = document.createElement('img')
			img.src = "icons/capacity.png"
			img.alt = "capacity"
			th.appendChild(img)
			
			const small = document.createElement("small")
			small.appendChild(document.createTextNode(rm.capacity))
			th.appendChild(small)
			
			for (i = startTime; i < endTime; i += timeStep) {
				const td = tr.insertCell()
				td.appendChild(document.createElement("div"))
			}
		}
	}
	document.getElementById("timetable").appendChild(tbl)
}

function dateInputChanged() {
	const dayinput = document.getElementById("dayinput")
	selectDay(dayinput.value)
}

/** select the date for which the data should be shown (in "YYYY-MM-DD" format) */
function selectDay(date) {
	const errorMsg = document.getElementById("inputerror")
	if (!date) {
		errorMsg.innerHTML = "<p>Please select a valid date.</p>"
		errorMsg.style.display = "block"
	} else if (!Object.hasOwn(jkudata.available, date)) {
		const start = jkudata.range.start.split("T")[0]
		const end = jkudata.range.end.split("T")[0]
		errorMsg.innerHTML = `<p>No data available for <strong>${date}</strong>.</p>` +
			`<p>Try selecting a date between <strong>${start}</strong> and <strong>${end}</strong>.</p>`
		errorMsg.style.display = "block"
	} else {
		errorMsg.style.display = "none"
	}
	fillTable(date)
	fillUsageStats(date)
}

/** fill the time table with availablility data for the specified day (in "YYYY-MM-DD" format) */
function fillTable(date) {
	const tbl = document.getElementById("maintable")
	let rowIdx = 1 // ignore header row
	for (let b in buildings) {
		// skip building row
		rowIdx++
		
		// add room rows for this building
		for (let r in buildings[b]) {
			let cellIdx = 1 // ignore first column
			
			for (let i = startTime; i < endTime; i += timeStep) {
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
	
	if (day == undefined || Object.keys(day).length === 0) { // days with no slots are empty objects
		return true
	}
	for (let slot in day[room]) {
		if (time >= day[room][slot][0] && time < day[room][slot][1]) {
			return true
		}
	}
	return false
}

let busyTimeSlots = null

function fillUsageStats(date) {
		const rs = Array(Object.keys(jkudata.rooms).length)
	const bs = Array(Object.keys(jkudata.buildings).length)
	const slots = Array((endTime - startTime) / timeStep).fill(0)
	const slotNames = Array((endTime - startTime) / timeStep)
	let totalTime = 0
	
	for (let i = 0; i < slots.length; i++) {
		const time = i * timeStep + startTime
		
		if (time % 60 == 0) {
			slotNames[i] = `${time / 60}:00`
		} else {
			slotNames[i] = ""
		}
	}
	
	for (let b in buildings) {
		if (bs[b] == undefined) {
			bs[b] = { name:jkudata.buildings[b].name, time:0 }
		}
		for (let r in buildings[b]) {
			const room = buildings[b][r]
			rs[r] = { name:room.name, time:0 }
			
			for (let i = 0; i < slots.length; i++) {
				const time = i * timeStep + startTime
				if (!isAvailable(r, time, date)) {
					rs[r].time += timeStep
					bs[b].time += timeStep
					slots[i]++
					totalTime += timeStep
				}
			}
		}
	}
	
	const totalHours = Math.round(totalTime / 60)
	const bsf = bs.filter(function (elem) { return elem != null; })
	
	// total hours
	document.getElementById("usageStatsTitle").innerHTML = `A total of ~${totalHours} hours of lectures this day!`
	
	if (totalHours <= 10) {
		document.getElementById("usageStatsHint").innerHTML = "*crickets*"
	} else if (totalHours <= 100) {
		document.getElementById("usageStatsHint").innerHTML = "Not too much going on this day."
	} else {
		document.getElementById("usageStatsHint").innerHTML = "Seems like another busy day at the JKU."
	}
	
	// busiest time slots
	const btsChart = usageCharts.busyTimeSlots
	btsChart.data.labels = slotNames
	btsChart.data.datasets[0].data = slots
	btsChart.update()
	
	rs.sort((a, b) => b.time - a.time)
	const brChart = usageCharts.busyRooms
	brChart.data.labels = rs.slice(0, 15).map(item => item.name)
	brChart.data.datasets[0].data = rs.slice(0, 15).map(item => item.time / (slots.length * timeStep) * 100)
	brChart.data.datasets[1].data = rs.slice(0, 15).map(item => 100 - (item.time / (slots.length * timeStep)) * 100)
	brChart.update()
	
	rs.sort((a, b) => a.time - b.time)
	const lrChart = usageCharts.lazyRooms
	lrChart.data.labels = rs.slice(0, 15).map(item => item.name)
	lrChart.data.datasets[0].data = rs.slice(0, 15).map(item => item.time / (slots.length * timeStep) * 100)
	lrChart.data.datasets[1].data = rs.slice(0, 15).map(item => 100 - (item.time / (slots.length * timeStep)) * 100)
	lrChart.update()
	
	bsf.sort((a, b) => b.time - a.time)
	const bbChart = usageCharts.busyBuildings
	bbChart.data.labels = bsf.map(item => shortBuildingName(item.name))
	bbChart.data.datasets[0].data = bsf.map(item => item.time / 60)
	bbChart.update()
}

/** create all charts and other info for the usage stats page */
function createUsageStats() {
	const stackedOption = {
		scales: {
			x: { stacked: true },
			y: { stacked: true }
		}
	}
	
	// busiest time slots
	usageCharts.busyTimeSlots = new Chart(document.getElementById("busyTimeSlots"), {
		type: "line",
		data: {
			labels: [],
			datasets: [{
				label: "# of lectures",
				data: [],
				backgroundColor: "#5b9bd5"
			}]
		}
	});
	
	// busiest rooms
	usageCharts.busyRooms = new Chart(document.getElementById("busyRooms"), {
		type: "bar",
		data: {
			labels: [],
			datasets: [{
				label: "% occupied",
				data: [],
				backgroundColor: "#ed7d31"
			}, {
				label: "% free",
				data: [],
				backgroundColor: "#70ad47"
			}]
		},
		options: stackedOption
	});
	
	// laziest rooms
	usageCharts.lazyRooms = new Chart(document.getElementById("lazyRooms"), {
		type: "bar",
		data: {
			labels: [],
			datasets: [{
				label: "% occupied",
				data: [],
				backgroundColor: "#ed7d31"
			}, {
				label: "% free",
				data: [],
				backgroundColor: "#70ad47"
			}]
		},
		options: stackedOption
	});
	
	// busy buildings
	usageCharts.busyBuildings = new Chart(document.getElementById("busyBuildings"), {
		type: "bar",
		data: {
			labels: [],
			datasets: [{
				label: "total lecture time",
				data: [],
				backgroundColor: "#5b9bd5"
			}]
		}
	});
}

/** create all charts and other info for the capacity stats page */
function createAndFillCapacityStats() {
	const rs = Array(Object.keys(jkudata.rooms).length)
	const bs = Array(Object.keys(jkudata.buildings).length)
	let totalCap = 0
	
	for (let b in buildings) {
		if (bs[b] == undefined) {
			bs[b] = { name:jkudata.buildings[b].name, capacity:0, nRooms:0 }
		}
		for (let r in buildings[b]) {
			const room = buildings[b][r]
			rs[r] = { name:room.name, capacity:room.capacity }
			bs[b].capacity += room.capacity
			bs[b].nRooms++
			totalCap += room.capacity
		}
	}
	const bsf = bs.filter(function (elem) { return elem != null; })
	const opts = {
		responsive: true,
		plugins: {
			legend: { position: 'right' },
		}
	}
	
	// total capacity
	document.getElementById("capacityStatsTitle").innerHTML = `Space for ${totalCap} students!`
	document.getElementById("capacityStatsHint").innerHTML = "That's the total capacity of all" +
		` ${rs.length} lecture rooms in ${bsf.length} different buildings.`
	
	// largest rooms
	rs.sort((a, b) => b.capacity - a.capacity)
	new Chart(document.getElementById("largestRooms"), {
		type: "bar",
		data: {
			labels: rs.slice(0, 15).map(item => item.name),
			datasets: [{
				label: "room capacity",
				data: rs.slice(0, 15).map(item => item.capacity),
				backgroundColor: "#5b9bd5"
			}]
		}
	});
	
	// smallest rooms
	rs.sort((a, b) => a.capacity - b.capacity)
	new Chart(document.getElementById("smallestRooms"), {
		type: "bar",
		data: {
			labels: rs.slice(0, 15).map(item => item.name),
			datasets: [{
				label: "room capacity",
				data: rs.slice(0, 15).map(item => item.capacity),
				backgroundColor: "#5b9bd5"
			}]
		}
	});
	
	// room count
	bsf.sort((a, b) => b.nRooms - a.nRooms)
	new Chart(document.getElementById("roomCount"), {
		type: "bar",
		data: {
			labels: bsf.map(item => shortBuildingName(item.name)),
			datasets: [{
				label: "room count",
				data: bsf.map(item => item.nRooms),
				backgroundColor: "#ed7d31"
			}]
		}
	});
	
	// building capacity
	bsf.sort((a, b) => b.capacity - a.capacity)
	new Chart(document.getElementById("largestBuildings"), {
		type: "bar",
		data: {
			labels: bsf.map(item => shortBuildingName(item.name)),
			datasets: [{
				label: "building capacity",
				data: bsf.map(item => item.capacity),
				backgroundColor: "#70ad47"
			}]
		}
	});
}

/** takes a string and returns the expression in the first parentheses or "" if none found */
function shortBuildingName(fullname) {
	const match = fullname.match(/\((.*?)\)/);

	if (match) {
		return match[1]
	} else {
		return ""
	}
}

/** display one of the tabs and hide the others */
function openTab(evt, tabName) {
	// hide all tabs
	const tabcontent = document.getElementsByClassName("tabcontent")
	for (let i = 0; i < tabcontent.length; i++) {
		tabcontent[i].style.display = "none"
	}

	// remove active from tablinks
	const tablinks = document.getElementsByClassName("tablinks")
	for (let i = 0; i < tabcontent.length; i++) {
		tablinks[i].classList.remove("tablinkactive")
	}

	// Show the current tab, and highlight tablink
	document.getElementById(tabName).style.display = "block"
	evt.currentTarget.classList.add("tablinkactive")
}
