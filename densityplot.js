document.addEventListener("DOMContentLoaded", function () {
    console.log("Density Plot Script Loaded"); // Debugging check

    const margin = { top: 20, right: 30, bottom: 50, left: 60 },
          width = 500 - margin.left - margin.right,
          height = 300 - margin.top - margin.bottom;

    // Remove any existing SVG before adding a new one
    d3.select("#density-plot").select("svg").remove();

    // Select the density-plot div and append an SVG
    const svg = d3.select("#density-plot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    console.log("SVG Created for Density Plot"); // Debugging check

    // Load the dataset
    d3.csv("data/typing_data.csv").then(data => {
        console.log("Data Loaded", data); // Debugging check

        // Ensure the typingSpeed column is numeric
        data.forEach(d => {
            d.typingSpeed = +d.typingSpeed;
        });

        // X-axis scale
        const x = d3.scaleLinear()
            .domain(d3.extent(data, d => d.typingSpeed))
            .range([0, width]);

        // Kernel Density Estimation
        function kernelDensityEstimator(kernel, X) {
            return function (V) {
                return X.map(x => {
                    return [x, d3.mean(V, v => kernel(x - v))];
                });
            };
        }

        function kernelEpanechnikov(k) {
            return function (u) {
                return Math.abs(u /= k) <= 1 ? 0.75 * (1 - u * u) / k : 0;
            };
        }

        const kde = kernelDensityEstimator(kernelEpanechnikov(7), x.ticks(40));

        // Filter groups
        const dataPD = data.filter(d => d.has_parkinsons === "Yes").map(d => d.typingSpeed);
        const dataNoPD = data.filter(d => d.has_parkinsons === "No").map(d => d.typingSpeed);

        const densityPD = kde(dataPD);
        const densityNoPD = kde(dataNoPD);

        const y = d3.scaleLinear()
            .domain([0, d3.max([...densityPD, ...densityNoPD], d => d[1])])
            .range([height, 0]);

        const line = d3.line()
            .curve(d3.curveBasis)
            .x(d => x(d[0]))
            .y(d => y(d[1]));

        // Parkinson's Density (Red)
        svg.append("path")
            .datum(densityPD)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2)
            .attr("d", line)
            .attr("opacity", 0.8);

        // No Parkinson's Density (Blue)
        svg.append("path")
            .datum(densityNoPD)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("d", line)
            .attr("opacity", 0.8);

        // X-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Y-axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 35)
            .attr("text-anchor", "middle")
            .text("Typing Speed (WPM)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text("Density");

        console.log("Density Plot Rendered Successfully"); // Debugging check

    }).catch(error => console.error("Error loading CSV: ", error));
});
