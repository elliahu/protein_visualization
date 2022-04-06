const ctx_top = document.getElementById('topChart');
const ctx_bottom = document.getElementById('bottomChart');
ctx_bottom.height = 50;
const ctx_navigation = document.getElementById('navigation');
ctx_navigation.height = 30;

let range = document.getElementById('thresholdRange');
let rangeLabel = document.getElementById('thresholdLabel');
const nextButton = document.getElementById('next');
const prevButton = document.getElementById('prev');
const nextPrevStep = 1;
const visibleStep = 10;
var btnhold = false;

const tension = 0.5;


/*
  Changes threshold
*/
range.addEventListener('input', function () {
	threshold.yValue = range.value;
	rangeLabel.innerHTML = threshold.yValue;

	console.log('threshold changed to ' + threshold.yValue);

	//change color background
	//TO BE CHANGED
	topChart.data.datasets[1].fill.target.value = threshold.yValue;

	//change horizontal line
	topChart.options.plugins.annotation.annotations.tresholdLine.yMin = threshold.yValue;
	topChart.options.plugins.annotation.annotations.tresholdLine.yMax = threshold.yValue;


	topChart.update();
	bottomChart.update();
});

/* Rerenders bottom boxes on threshold change */
range.addEventListener('change', function (){
	bottomChart.options.plugins.annotation = {};
	bottomChart.options.plugins.annotation = drawBoxes(yValues2.topChart,threshold);
	bottomChart.update();
});

// Sample data
const numOfValues = 200;
const xValues = Array.from({ length: numOfValues }, () => (
	String.fromCharCode(Math.floor(Math.random() * ('Z'.charCodeAt() - 'A'.charCodeAt()) + 'A'.charCodeAt())))
);
console.log(xValues);
const yValues = {
	topChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	),
	bottomChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	)
}
const yValues2 = {
	topChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	),
	bottomChart: Array.from({ length: numOfValues }, () => (
		Math.floor(Math.random() * (11 - 0) + 0)) / 10
	)
}


let threshold = { yValue: .5 };
range.value = threshold;
rangeLabel.innerHTML = range.value;

/*
  Applies configuration and position of one chart to different chart
*/
function updateChart(getUpdateChart, setUpdateChart) {
	setUpdateChart.options.scales.x.min = getUpdateChart.options.scales.x.min;
	setUpdateChart.options.scales.x.max = getUpdateChart.options.scales.x.max;
	setUpdateChart.update();
	updateNavigation();
}

/*
  Function renders threshold line into the chart
*/
function getThresholdAnnotation(threshold) {
	return {
		annotations: {
			tresholdLine: {
				// Indicates the type of annotation
				type: 'line',
				yMin: threshold,
				yMax: threshold,
				backgroundColor: 'rgba(255, 99, 132, 0.25)',
				borderDash: [5, 15]
			}
		}
	}
}

/* Draws second chart boxes */
function drawBoxes(dataset,threshold) {

	let ret = {
		annotations: {
		}
	}
	let i = 0;
	dataset.forEach((value) => {
		if(value >= threshold.yValue){
			ret.annotations['box' + i] = {
				type: 'box',
				xMin: i-.5,
				xMax: i+.5,
				yMin: .5,
				yMax: 1,
				backgroundColor: 'rgba(236, 212, 68,0.5)',
				borderWidth:0
			}
		}
		i++;
	});

	console.log(ret);
	return ret;
}



let topChartData = {
	labels: xValues,
	datasets: [
		{
			label: 'ASA',
			data: yValues.topChart,
			borderColor: 'rgb(75, 192, 192)',
			tension: tension,
			borderDash: [5, 5],
			/*fill: {
			  target: { value: treshold },
			  above: 'rgba(236, 212, 68,0.5)',
			  below: 'rgba(0,0,0,0)'
			},*/
		},
		{
			label: 'Aggregation',
			data: yValues2.topChart,
			borderColor: '#333333',
			tension: tension,
			fill: {
				backgroundColor: 'rgba(0,0,0,0)',
				target: { value: threshold.yValue },
				above: 'rgba(236, 212, 68,0.5)',
				below: 'rgba(0,0,0,0)'
			},
		}
	]
};
const topChartConfig = {
	type: 'line',
	data: topChartData,
	options: {
		animation: false,
		responsive: true,
		scales: {
			x: {
				min: 0,
				max: visibleStep,
			}
		},
		plugins: {
			zoom: {
				zoom: {
					wheel: {
						enabled: true
					},
					pinch: {
						enabled: true
					},
					mode: 'x',
					onZoom: function () {
						console.log("zoom");
						updateChart(topChart, bottomChart);
					}
				},
				pan: {
					enabled: true,
					mode: 'x',
					threshold: 1,
					onPan: function () {
						console.log("pan");
						updateChart(topChart, bottomChart);
					}
				}
			},
			annotation: getThresholdAnnotation(threshold.yValue)
		}
	}
};


const bottomChartData = {
	labels: xValues,
	datasets: [
		{
			label: 'Aggregation',
			data: [],
			borderColor: '#333333',
			tension: tension,
			fill: {
				backgroundColor: 'rgba(0,0,0,0)',
				target: { value: threshold.yValue },
				above: 'rgba(236, 212, 68,0.5)',
				below: 'rgba(0,0,0,0)'
			},
		}
	]
};
const bottomChartConfig = {
	type: 'line',
	data: bottomChartData,
	options: {
		animation: false,
		responsive: true,
		scales: {
			x: {
				min: 0,
				max: visibleStep,
			},
			y:{
				display:false
			}
		},
		plugins: {
			zoom: {
				zoom: {
					wheel: { enabled: true },
					mode: 'x',
					onZoom: function () {
						console.log("zoom");
						updateChart(bottomChart, topChart);
					}
				},
				pan: {
					enabled: true,
					mode: 'x',
					threshold: 0,
					onPan: function () {
						console.log("pan");
						updateChart(bottomChart, topChart);
					}
				}
			},
			annotation: drawBoxes(yValues2.topChart,threshold)
		}
	}
};

/* Top chart */
const topChart = new Chart(ctx_top, topChartConfig);
/* Bottom Chart */
const bottomChart = new Chart(ctx_bottom, bottomChartConfig);


const navigationData = {
	labels: xValues,
	datasets: [
		{
			label: 'Selected area',
			data: yValues2.bottomChart,
			borderColor:[
				'rgba(33,33,33, 0.5)'
			],
			backgroundColor:[
				'rgba(255, 99, 132, 0.25)'
			],
			parsing: false
		}
	]
};

const navigationConfig = {
	type: 'line',
	data: navigationData,
	options: {
		maintainAspectRatio: true,
		animation: false,
		responsive: true,
		plugins: {
			autocolors: false,
			annotation: {
				annotations: {
					visible: {
						type: 'box',
						xMin: 0,
						xMax: visibleStep,
						yMin: 0,
						yMax: 1,
						backgroundColor: 'rgba(255, 99, 132, 0.25)'
					}
				}
			},
			decimation:{
				enabled: true,
				algorithm: 'lttb',
				samples: 150
			}
		},
		onClick(e){
			selectArea(e);
		}
	}
};

/* Navigation */
const navigation = new Chart(ctx_navigation, navigationConfig);

/* Function selects area from navigation */
function selectArea(event){
	let xPos = event.x * (navigation.config.data.datasets[0].data.length / navigation.width);
	moveNavigation(xPos);
}



/*
	Updates navigation chart
*/
function updateNavigation(){
	navigation.options.plugins.annotation.annotations.visible.xMin = topChart.options.scales.x.min;
	navigation.options.plugins.annotation.annotations.visible.xMax = topChart.options.scales.x.max;
	navigation.update();
}

function moveNavigation(x){
	/* Update navigation */
	navigation.options.plugins.annotation.annotations.visible.xMin = x;
	navigation.options.plugins.annotation.annotations.visible.xMax = x +  topChart.options.scales.x.max - topChart.options.scales.x.min;
	navigation.update();

	/* Update chart */
	moveChart(topChart,x);
	moveChart(bottomChart,x);
}

/*
	Next Button Clicked
*/
nextButton.addEventListener('click', chartNext);

/*
	Prev Button Clicked
*/
prevButton.addEventListener('click', chartPrev);


function moveChart(chart, x){
	let step = chart.options.scales.x.max - chart.options.scales.x.min;
	chart.options.scales.x.min = x;
	chart.options.scales.x.max = x + step;
	chart.update();
}

function chartNext(){
	if (true) { // TO DO bounds
		topChart.options.scales.x.min += nextPrevStep;
		topChart.options.scales.x.max += nextPrevStep;
		topChart.update();
		updateChart(topChart, bottomChart);
	}
}

function chartPrev(){
	if (true) { // TO DO bounds
		topChart.options.scales.x.min -= nextPrevStep;
		topChart.options.scales.x.max -= nextPrevStep;
		topChart.update();
		updateChart(topChart, bottomChart);
	}
}