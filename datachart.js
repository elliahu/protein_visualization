// Dataset is used to encapsulate displayed values
export class Dataset{
	type = 'line';
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

	// configs
	topChartConfig = {
		data: {
			labels: this.labels,
			datasets: []
		},
		options: {
			onHover: (event, elements) => {
				//this.syncHighlight(event,elements);
			},
			barPercentage: 1,
			interaction: {
				mode: 'point'
			},
			animation:{
				duration: 150
			},
			animation:false,
			responsive: true,
			scales: {
				x: {
					min: this.visibleArea.min,
					max: this.visibleArea.max,
					position:{
						y: 0
					},
				},
				y:{
					min: -.5,
					max: 1,
					ticks:{
						callback: function(value,index,ticks){
							return (value >= 0)? this.getLabelForValue(value) : null;
						}
					},
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
							//this.#syncPosition();
						},
						onZoomComplete: ()=>{
							//this.#syncPosition();
						}
					},
					pan: {
						enabled: true,
						mode: 'x',
						threshold: 0,
						onPan: () => {
							this.#setPosition(this.topChart);
							//this.#syncPosition();
						},
						onPanComplete: () =>  {
							//this.#syncPosition();
						}
					}
				},
				annotation: {
					animations: false,
					common: {
						drawTime: 'afterDraw'
					},
					annotations:{
						thresholdAnnotation: this.#getThresholdAnnotation(this.threshold),
					}
				},
				tooltip:{
					cornerRadius: 0
				}
			},
			maintainAspectRatio: false,
		}
	};

	// private fields
	#topChartCanvas;

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

		// create canvases for the charts
		let topChartCanvas = document.createElement('canvas');
		topChartCanvas.id = 'dataChartCanvas1';
		this.#topChartCanvas = topChartCanvas;
		topChartContainer.appendChild(topChartCanvas);

		// append chart containers to main container
		container.appendChild(topChartContainer);

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

		this.#create();
		this.#renderAPRs();
	}

	/// main method
	#create(){
		// create charts
		this.topChart = new Chart(this.#topChartCanvas, this.topChartConfig);
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
				this.#syncPosition();
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
		this.topChart.options.plugins.annotation.annotations.thresholdAnnotation.yMin = this.threshold;
		this.topChart.options.plugins.annotation.annotations.thresholdAnnotation.yMax = this.threshold;


		this.topChart.update();
		this.topChart.options.animation = true;
		// rerender bottom boxes
		this.#renderAPRs();
	}


	// creates bars in bottom chart
	#renderAPRs(){

		for(let i = 0; i < this.labels.length; i++){
			this.topChartConfig.options.plugins.annotation.annotations['APRbox' + i] = null;
			if(this.datasets[0].data[i] > this.threshold)
				this.topChartConfig.options.plugins.annotation.annotations['APRbox' + i] = {
					type: 'box',
					xMin: i -.5,
					xMax: i + .5,
					yMin: -.35,
					yMax: -.25,
					backgroundColor: 'rgba(255, 184, 0,0.5)',
					borderColor: 'rgba(0, 0, 0,0)',
				}
		}

		this.topChart.update();
	}

	#setPosition(chart){
		this.visibleArea.min = chart.options.scales.x.min;
		this.visibleArea.max = chart.options.scales.x.max;
	}

	// Syncs position of both charts
	#syncPosition(){
		this.navigationRange.setValues(this.visibleArea.min,this.visibleArea.max);
	}

	/*
	Method renders threshold line into the chart
	*/
	#getThresholdAnnotation(threshold) {
		return {
			// Indicates the type of annotation
			type: 'line',
			yMin: this.threshold,
			yMax: this.threshold,
			backgroundColor: 'rgba(255, 99, 132, 0.25)',
			borderDash: [10, 15]
		}
	}

	// updates both top and bottom chart
	// useful when changing config 
	update(){
		this.topChart.update();
		this.bottomChart.update();
	}

	//Next button clicked
	chartNextStep(){
		if(true){ // to do bounds
			this.visibleArea.min += 10;
			this.visibleArea.max += 10;
			this.#syncPosition();
		}
	}

	//Prev button clicked
	chartPrevStep(){
		if (true) { // TO DO bounds !!!!!!
			if(true){ // to do bounds
				this.visibleArea.min -= 10;
				this.visibleArea.max -= 10;
				this.#syncPosition();
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

	// moves chart to specific position on x axis
	moveChartTo(min, max){
		this.topChart.options.scales.x.min = min;
		this.topChart.options.scales.x.max = max;
		this.bottomChart.options.scales.x.min = min;
		this.bottomChart.options.scales.x.max = max;

		this.navigationRange.setValues(min,max);

		this.update();
	}

	// synchronizes highlith (hover effect on both charts)
	syncHighlight(event, elemets){
		for(let i = 0; i < elemets.length; i++){
			let e = elemets[i];
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
		}
	}

	// sets visibility of dataset
	setDatasetVisibility(index, visible = false){
		if(index >= 0 && index <= this.datasets.length){
			this.topChart.setDatasetVisibility(index, visible);
			this.topChart.update();
		}
		else{
			throw "index out of range";
		}
	}

	// sets active (highlighted) element
	setActiveElement(datasetIndex, valueIndex){
		this.topChart.setActiveElements([
			{
				datasetIndex: datasetIndex,
				index: valueIndex
			}
		]);
		this.bottomChart.setActiveElements([
			{
				datasetIndex: 0,
				index: valueIndex
			}
		]);
		this.topChart.update();
		this.bottomChart.update();
	}

}


