import {fetchDataCSV, makeChart} from './datachart.js';

let csv = 'output_last/avg_Maternal_protein_pumilio.csv';

fetchDataCSV(csv).then((result) => {
    setTimeout(() => makeChart(result.data));
});