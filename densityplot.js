// Density Plot for Typing Speed in Parkinson's and Non-Parkinson's Patients
document.addEventListener('DOMContentLoaded', () => {
    // Get the parent container and its dimensions
    const container = document.querySelector('#density-plot').parentElement;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Dynamic margin calculation
    const margin = {
        top: containerHeight * 0.05,    
        right: containerWidth * 0.1,    
        bottom: containerHeight * 0.25, 
        left: containerWidth * 0.1       
    };

    // Adjust width and height to fit container
    const width = Math.min(containerWidth - margin.left - margin.right, 800);
    const height = Math.min(containerHeight - margin.top - margin.bottom, 400);

    // Select the SVG element and set its dimensions
    const svg = d3.select("#density-plot")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Load and process the data
    Promise.all([
        d3.csv("data/GT_DataPD_MIT-CS1PD.csv"),
        d3.csv("data/GT_DataPD_MIT-CS2PD.csv")
    ]).then(([data1, data2]) => {
        const data = [...data1, ...data2]; // Merge the datasets

        // Convert typing speed to numbers and separate Parkinson's and non-Parkinson's groups
        const parkinsonsData = data
            .filter(d => d.gt === "True")
            .map(d => +d.typingSpeed)
            .filter(d => !isNaN(d));

        const nonParkinsonsData = data
            .filter(d => d.gt === "False")
            .map(d => +d.typingSpeed)
            .filter(d => !isNaN(d));

        // Kernel Density Estimation function
        function kernelDensityEstimator(kernel, X) {
            return function (V) {
                return X.map(function (x) {
                    return [x, d3.mean(V, function (v) { return kernel(x - v); })];
                });
            };
        }

        function epanechnikovKernel(bandwidth) {
            return function (u) {
                return Math.abs(u /= bandwidth) <= 1 ? 0.75 * (1 - u * u) / bandwidth : 0;
            };
        }

        // Calculate bandwidth (Silverman's rule of thumb)
        const parkBandwidth = 1.06 * d3.deviation(parkinsonsData) * Math.pow(parkinsonsData.length, -1 / 5);
        const nonParkBandwidth = 1.06 * d3.deviation(nonParkinsonsData) * Math.pow(nonParkinsonsData.length, -1 / 5);

        // Prepare X scale
        const x = d3.scaleLinear()
            .domain([
                Math.min(d3.min(parkinsonsData), d3.min(nonParkinsonsData)) - 10,
                Math.max(d3.max(parkinsonsData), d3.max(nonParkinsonsData)) + 10
            ])
            .range([0, width]);

        // Prepare Y scale
        const y = d3.scaleLinear()
            .range([height, 0]);

        // Create density estimators
        const parkDensity = kernelDensityEstimator(
            epanechnikovKernel(parkBandwidth),
            x.ticks(100)
        )(parkinsonsData);

        const nonParkDensity = kernelDensityEstimator(
            epanechnikovKernel(nonParkBandwidth),
            x.ticks(100)
        )(nonParkinsonsData);

        // Set Y domain based on max density
        y.domain([0, Math.max(
            d3.max(parkDensity, d => d[1]),
            d3.max(nonParkDensity, d => d[1])
        )]);

        // Create line generator
        const line = d3.line()
            .curve(d3.curveBasis)
            .x(d => x(d[0]))
            .y(d => y(d[1]));

        // Color scale function
        const colorScale = d => d.gt === "True" ? "#6c63ff" : "#ffb663";

        // Add Parkinson's density line
        svg.append("path")
            .datum(parkDensity)
            .attr("fill", "none")
            .attr("stroke", data.find(d => d.gt === "True") ? colorScale(data.find(d => d.gt === "True")) : "#6c63ff")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add non-Parkinson's density line
        svg.append("path")
            .datum(nonParkDensity)
            .attr("fill", "none")
            .attr("stroke", data.find(d => d.gt === "False") ? colorScale(data.find(d => d.gt === "False")) : "#ffb663")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Add X axis label
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom * 0.7)
            .style("text-anchor", "middle")
            .text("Typing Speed (WPM)");

        // Add Y axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left * 0.7)
            .style("text-anchor", "middle")
            .text("Density");

        // Add legend
        svg.append("circle")
            .attr("cx", width - 100)
            .attr("cy", 20)
            .attr("r", 6)
            .style("fill", data.find(d => d.gt === "True") ? colorScale(data.find(d => d.gt === "True")) : "#6c63ff");
        svg.append("text")
            .attr("x", width - 80)
            .attr("y", 20)
            .text("Parkinson's")
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");

        svg.append("circle")
            .attr("cx", width - 100)
            .attr("cy", 40)
            .attr("r", 6)
            .style("fill", data.find(d => d.gt === "False") ? colorScale(data.find(d => d.gt === "False")) : "#ffb663");
        svg.append("text")
            .attr("x", width - 80)
            .attr("y", 40)
            .text("Non-Parkinson's")
            .style("font-size", "12px")
            .attr("alignment-baseline", "middle");

    }).catch(error => {
        console.error("Error loading the data:", error);
    });
});