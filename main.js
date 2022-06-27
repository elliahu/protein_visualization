import {fetchDataCSV,parseCSV, makeChart} from './datachart.js';

let csv = 'output_last/avg_Maternal_protein_pumilio.csv';

let config = {
    enableControls: true
}

fetchDataCSV(csv).then((result) => {
    setTimeout(() => makeChart(result.data, config, document.body));
});

//setTimeout(() => makeChart(parseCSV('valid csv with /n line breaks', ';'), config, document.body));