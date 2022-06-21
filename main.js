import {Dataset,DataChart} from './datachart.js';

// usage
let testData = new DataChart();
await testData.fetchCsvFile('output_last/avg_Envelope_small_membrane_protein.csv');
testData.init(document.getElementById('testDiv'));

// adding extra dataset on top
let x = new Dataset();
x.label = 'Custom dataset';
x.borderColor = 'rgb(255,0,0)';
x.type = 'line';
x.borderDash = [10,5];
x.data = [0,0.5,0.2,0,0.5,0.20,0.5,0.20,0.5,0.20,0.5,0.20,0.5,0.20,0.5,0.20,0.5,0.20,0.5,0.2];
testData.addDataset(x);


// avg_PB1-F2
// avg_Envelope_small_membrane_protein
// avg_Odontogenic_ameloblast-associated_protein
// avg_Translational_regulator_orb2