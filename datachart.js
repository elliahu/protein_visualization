// Dataset is used to encapsulate displayed values
export class Dataset{
	type = 'bar';
	filename = '';
	backgroundColor = 'rgba(0,0,0,1)';
	borderColor = 'rgba(0,0,0,1)';
	hoverBackgroundColor = 'rgba(255, 184, 0,0.5)';
	borderDash = [];
	tension = 0.5;
	barPercentage = 1;
	categoryPercentage = 1;
	data = [];
	label = 'hidden';
}

// represents the top row of chart controls
export class DataChartControls{
	thresholdRange;
	thresholdInput;
	prevButton;
	nextButton;

	create(prevText = 'Prev', nextText = 'Next'){
		this.#createThresholdRange();
		this.#createThresholdInput();
		this.#createPrevButton(prevText);
		this.#createNextButton(nextText);
	}

	#createThresholdRange(){
		this.thresholdRange = document.createElement('input');
		this.thresholdRange.type = 'range';
		this.thresholdRange.min = 0;
		this.thresholdRange.max = 1;
		this.thresholdRange.step = .01;
	}

	#createThresholdInput(){
		this.thresholdInput = document.createElement('input');
		this.thresholdInput.type = 'number';
		this.thresholdInput.step = .05;
	}

	#createPrevButton(prevText){
		this.prevButton = document.createElement('button');
		this.prevButton.innerHTML = prevText;
	}

	#createNextButton(nextText){
		this.nextButton = document.createElement('button');
		this.nextButton.innerHTML = nextText;
	}

}

export class DataChart{
	// public fields
	labels = [];
	datasets = [];
	controls = new DataChartControls();
	topChart;
	bottomChart;
	navigationRange;

	settings = {
		nextPrevStep : 1,
		nextMultiplier : 50,
		visibleStep : 10,
		btnhold : false,
		tension : 0.5,
		bottomChartHeight: 75
	}

	threshold = 0.5;

	highlightIndex = null;

	visibleArea = {
		min: 1,
		max: 10
	};

	bottomChartBars = [];

	// events
	static highlightChanged = new Event('highlightChanged');

	// configs

	topChartConfig = {
		data: {
			labels: this.labels,
			datasets: []
		},
		options: {
			onHover: (event, elements) => {
				this.syncHighlight(event,elements);
			},
			barPercentage: 1,
			interaction: {
				mode: 'index'
			},
			animation:{
				duration: 150
			},
			responsive: true,
			scales: {
				x: {
					min: this.visibleArea.min,
					max: this.visibleArea.max,
				},
				y:{
					min: 0,
					max: 1
				}
			},
			transitions: {
				active:{
					animation:{
						duration :0
					}
				}
			},
			plugins: {
				legend: {
					labels: {
					  filter: function(item, chart) {
						return !item.text.includes('hidden');
					  }
					}
				  },
				zoom: {
					zoom: {
						wheel: {
							enabled: true
						},
						pinch: {
							enabled: true
						},
						mode: 'x',
						onZoom: () => {
							this.#setPosition(this.topChart);
							this.syncPosition();
						}
					},
					pan: {
						enabled: true,
						mode: 'x',
						threshold: 0,
						onPan: () => {
							this.#setPosition(this.topChart);
							this.syncPosition();
						}
					}
				},
				annotation: this.getThresholdAnnotation(this.threshold),
				tooltip:{
					cornerRadius: 0
				}
			},
			maintainAspectRatio: false,
		}
	};

	bottomChartConfig = {
		type: 'bar',
		data: {
			labels: [],
			datasets: []
		},
		options: {
			onHover: (event, elements) => {
				this.syncHighlight(event,elements);
			},
			animation:{
				duration: 200
			},
			transitions: false,
			responsive: true,
			legend: {
				labels: {
					display:false
				}
			},
			scales: {
				x: {
					min: this.visibleArea.min,
					max: this.visibleArea.max,
				},
				y:{
					min:0,
					max:1,
					grid:{
						display:false
					},
					ticks:{
						color:'rgba(0,0,0,0)'
					}
				}
			},
			plugins: {
				legend:{
					display:false
				},
				tooltip:{
					enabled:false
				},
				zoom: {
					zoom: {
						wheel: { enabled: false },
						mode: 'x',
						onZoom: function () {
							
						}
					},
					pan: {
						enabled: false,
						mode: 'x',
						threshold: 0,
						onPan: function () {
							
						}
					}
				},
			},
			maintainAspectRatio: false,
		}
	};


	// private fields
	#topChartCanvas;
	#bottomChartCanvas;

	/// fetches data in CSV format using get request
	async fetchCsvFile(path, separator = ';'){
		// load data
		let data = await fetch(path);
		if(!data.ok){
			throw `Could not fetch ${path} file!`;
		}
		let text = await data.text();

		// parse text line by line
		let lines = text.split('\n');
		if(lines.length > 0){
			// empty instace of Dataset
			let dataset = new Dataset();
			dataset.filename = path;

			// for each line
			lines.forEach((line, index) => {
				line = line.trim();
				let cells = line.split(separator);
				if(cells.length > 0){

					// expected format:
					// LABEL separator ASA ...
					this.labels.push(cells[0]);
					dataset.data.push(cells[1]);

				}
				else{
					throw `File ${path} is not in the correct CSV format`;
				}
			});

			// finally, push the newly created dataset to the datasets array
			this.datasets.push(dataset);
			this.topChartConfig.data.datasets.push({
				type: 'line',
				data: dataset.data,
				backgroundColor: dataset.backgroundColor,
				borderColor: dataset.borderColor,
				tension: dataset.tension,
				fill: {
					backgroundColor: 'rgba(0,0,0,0)',
					target: { value: this.threshold },
					above: 'rgba(236, 212, 68,0.5)',
					below: 'rgba(0,0,0,0)'
				},
				label: 'Aggregation line'
			});
			this.topChartConfig.data.datasets.push({
				type: 'bar',
				data: dataset.data,
				barPercentage: dataset.barPercentage,
				categoryPercentage: dataset.categoryPercentage,
				hoverBackgroundColor: dataset.hoverBackgroundColor,
				label: 'Aggregation value'
			});
		}
		else{
			throw `File ${path} is empty`;
		}
	}

	addDataset(dataset){
		this.datasets.push(dataset);
		let dataObj = {
			type: dataset.type,
			data: dataset.data,
			label: dataset.label,
			borderColor: dataset.borderColor,
			backgroundColor:dataset.backgroundColor,
			hoverBackgroundColor: dataset.hoverBackgroundColor
		};

		if(dataset.type === 'bar'){
			dataObj.barPercentage = dataset.barPercentage;
			dataObj.categoryPercentage = dataset.categoryPercentage;
		}

		if(dataset.type === 'line'){
			dataObj.tension = dataset.tension;
			dataObj.borderDash = dataset.borderDash;
		}

		this.topChartConfig.data.datasets.push(dataObj);
		
		if(this.datasets.length - 1 > 0){
			this.topChart.update();
			this.bottomChart.update();
		}
		
	}

	/// Creates the chart and containers
	init(container){
		// create controls
		let controlsContainer = document.createElement('div');
		controlsContainer.id = 'dataChartControls';
		this.controls.create();
		controlsContainer.appendChild(this.controls.thresholdRange);
		this.controls.thresholdRange.value = this.threshold;
		this.controls.thresholdInput.value = this.threshold;
		controlsContainer.appendChild(this.controls.thresholdInput);
		controlsContainer.appendChild(this.controls.prevButton);
		controlsContainer.appendChild(this.controls.nextButton);
		container.appendChild(controlsContainer);

		// create chart containers
		let topChartContainer = document.createElement('div');
		topChartContainer.id = 'dataChartTopChartContainer';

		let bottomChartContainer = document.createElement('div');
		bottomChartContainer.id = 'dataChartBottomChartContainer';

		// create canvases for the charts
		let topChartCanvas = document.createElement('canvas');
		topChartCanvas.id = 'dataChartCanvas1';
		this.#topChartCanvas = topChartCanvas;
		let bottomChartCanvas = document.createElement('canvas');
		bottomChartCanvas.id = 'dataChartCanvas2';
		bottomChartCanvas.height = this.settings.bottomChartHeight;
		this.#bottomChartCanvas = bottomChartCanvas;
		topChartContainer.appendChild(topChartCanvas);
		bottomChartContainer.appendChild(bottomChartCanvas);

		// append chart containers to main container
		container.appendChild(topChartContainer);
		container.appendChild(bottomChartContainer);

		// navigation range
		let navContainer = document.createElement('div');
		navContainer.id = 'dataChartNavContainer';
		let navRange = document.createElement('input');
		navRange.type = 'range';
		navRange.id = 'navRange';
		navContainer.appendChild(navRange);
		container.appendChild(navContainer);

		// asign callbacks
		this.controls.prevButton.addEventListener('click',() => this.chartPrevStep());
		this.controls.nextButton.addEventListener('click',() => this.chartNextStep());

		this.create();
		this.#initBottomChartBars();
	}

	/// main method
	create(){
		// create charts
		this.topChart = new Chart(this.#topChartCanvas, this.topChartConfig);
		this.bottomChart = new Chart(this.#bottomChartCanvas, this.bottomChartConfig);
		//create range slider
		this.navigationRange = new rSlider({
			target: '#navRange',
			values: Array.from(Array(this.labels.length).keys()),
			range: true,
			tooltip: true,
			scale: true,
			labels: false,
			set: [0, this.settings.visibleStep],
			onChange: () => {
				this.visibleArea.min = this.navigationRange.values.start;
				this.visibleArea.max = this.navigationRange.values.end;
				this.syncPosition();
			}
		});
		this.controls.thresholdRange.addEventListener('input', (e) => {
			this.#onThresholdRangeChange(e.target.value);
		});
		this.controls.thresholdInput.addEventListener('change', (e) => {
			this.threshold = e.target.value;
			this.controls.thresholdRange.value = e.target.value;
			this.#onThresholdRangeChange(this.threshold);
		});
	}

	/// called when threshold range is moved
	#onThresholdRangeChange(threshold){
		this.threshold = this.controls.thresholdRange.value;
		this.controls.thresholdInput.value = this.controls.thresholdRange.value;

		//change color background
		//TO BE CHANGED
		this.topChart.options.animation = false;
		this.topChart.data.datasets[0].fill.target.value = this.threshold;

		//change horizontal line
		this.topChart.options.plugins.annotation.annotations.tresholdLine.yMin = this.threshold;
		this.topChart.options.plugins.annotation.annotations.tresholdLine.yMax = this.threshold;


		this.topChart.update();
		this.bottomChart.update();
		this.topChart.options.animation = true;

		// rerender bottom boxes
		this.#initBottomChartBars();
	}


	// creates bars in bottom chart
	#initBottomChartBars(){
		this.bottomChartBars = [];
		this.bottomChart.data.datasets = [];
		this.datasets[0].data.forEach( element => {
			if(element >= this.threshold){
				this.bottomChartBars.push(1);
			}
			else{
				this.bottomChartBars.push(0);
			}
		});
		this.bottomChart.data.datasets.push({
			data: this.bottomChartBars,
			barPercentage: 1,
			categoryPercentage: 1,
			hoverBackgroundColor: 'rgba(255, 184, 0,0.5)',
		});
		this.bottomChart.data.labels = this.labels;
		this.bottomChart.update();
	}

	#setPosition(chart){
		this.visibleArea.min = chart.options.scales.x.min;
		this.visibleArea.max = chart.options.scales.x.max;
	}

	// Syncs position of both charts
	syncPosition(){
		this.topChart.options.scales.x.min = this.visibleArea.min;
		this.bottomChart.options.scales.x.min = this.visibleArea.min;
		this.topChart.options.scales.x.max = this.visibleArea.max;
		this.bottomChart.options.scales.x.max = this.visibleArea.max;
		this.topChart.update();
		this.bottomChart.update();
		this.navigationRange.setValues(this.visibleArea.min,this.visibleArea.max);
	}

	/*
	Method renders threshold line into the chart
	*/
	getThresholdAnnotation(threshold) {
		return {
			annotations: {
				tresholdLine: {
					// Indicates the type of annotation
					type: 'line',
					yMin: this.threshold,
					yMax: this.threshold,
					backgroundColor: 'rgba(255, 99, 132, 0.25)',
					borderDash: [5, 15]
				}
			}
		}
	}

	//Next button clicked
	chartNextStep(){
		if(true){ // to do bounds
			this.visibleArea.min += 10;
			this.visibleArea.max += 10;
			this.syncPosition();
		}
	}

	//Prev button clicked
	chartPrevStep(){
		if (true) { // TO DO bounds !!!!!!
			if(true){ // to do bounds
				this.visibleArea.min -= 10;
				this.visibleArea.max -= 10;
				this.syncPosition();
			}
		}
	}

	//changes charts position on the x axis to specific value
	//if curr pos is x.min = 10 and x.max = 20 and we call moveChart(chart, 43)
	//then the position will change to x.min = 43 and x.max = 53
	moveChart(chart, x){
		let step = chart.options.scales.x.max - chart.options.scales.x.min;
		chart.options.scales.x.min = x;
		chart.options.scales.x.max = x + step;
		chart.update();
	}

	// synchronizes highlith (hover effect on both charts)
	syncHighlight(event, elemets){
		elemets.forEach( e => {
			this.topChart.setActiveElements([
				{
					datasetIndex: 1,
					index: e.index
				}
			]);
			this.bottomChart.setActiveElements([
				{
					datasetIndex: 0,
					index: e.index
				}
			]);
			this.topChart.update();
			this.bottomChart.update();
		});
	}
}


