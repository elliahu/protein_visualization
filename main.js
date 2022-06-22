import {fetchDataCSV, makeChart} from './datachart.js';

fetchDataCSV('output_last/avg_Maternal_protein_pumilio.csv').then((result) => {
    setTimeout(() => makeChart(result.data));
});