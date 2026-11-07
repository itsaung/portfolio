import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const projectsTitle = document.querySelector('.projects-title');

let query = '';
let selectedIndex = -1;

const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
const colors = d3.scaleOrdinal(d3.schemeTableau10);

function filterProjectsByQuery(projectList) {
	return projectList.filter((project) => {
		const values = Object.values(project).join('\n').toLowerCase();
		return values.includes(query.toLowerCase());
	});
}

function renderPieChart(projectsGiven) {
	const rolledData = d3.rollups(
		projectsGiven,
		(v) => v.length,
		(d) => d.year,
	);

	const data = rolledData.map(([year, count]) => {
		return { value: count, label: year };
	});

	const sliceGenerator = d3.pie().value((d) => d.value);
	const arcData = sliceGenerator(data);
	const arcs = arcData.map((d) => arcGenerator(d));

	const svg = d3.select('#projects-pie-plot');
	svg.selectAll('path').remove();

	arcs.forEach((arc, i) => {
		svg
			.append('path')
			.attr('d', arc)
			.attr('fill', colors(i))
			.attr('class', selectedIndex === i ? 'selected' : null)
			.on('click', () => {
				selectedIndex = selectedIndex === i ? -1 : i;

				svg
					.selectAll('path')
					.attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));

				const legend = d3.select('.legend');
				legend
					.selectAll('li')
					.attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : null));

				if (selectedIndex === -1) {
					renderProjects(projects, projectsContainer, 'h2');
				} else {
					const year = data[selectedIndex].label;
					const filtered = projects.filter((p) => p.year === year);
					renderProjects(filtered, projectsContainer, 'h2');
				}
			});
	});

	const legend = d3.select('.legend');
	legend.selectAll('li').remove();

	data.forEach((d, idx) => {
		legend
			.append('li')
			.attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
			.attr('style', `--color:${colors(idx)}`)
			.html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
	});
}

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);
projectsTitle.textContent = `${projects.length} Projects`;

const searchInput = document.querySelector('.searchBar');
searchInput.addEventListener('change', (event) => {
	query = event.target.value;
	selectedIndex = -1;

	const filteredProjects = filterProjectsByQuery(projects);
	renderProjects(filteredProjects, projectsContainer, 'h2');
	renderPieChart(filteredProjects);
});
