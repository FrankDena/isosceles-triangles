/*
  This script loads a JSON file containing multivariate data:
  - There are 10 data-cases, each with five positive quantitative variables.

  Using this data, the script draws 10 isosceles triangles on the drawing area,
  with each triangle corresponding to a data-case.
    - The first variable determines the triangle's horizontal (x) position.
    - The second variable determines the vertical (y) position.
    - The third variable determines the base length of the triangle.
    - The fourth variable determines the height of the triangle.
    - The fifth variable controls the fill color hue.

  Interactivity:
    - Left-clicking on a triangle selects it (the selected state is visually indicated).
    - Clicking a second triangle swaps the variable values (except for x, y, and color) between the selected and clicked triangles.
    - When triangle dimensions change, transitions are animated smoothly.
    - Sound effects are played on triangle selection and swapping.

  Implementation details:
    - D3.js scales are used to map the variable domains (which may be arbitrary) onto the interface's admissible value ranges.
*/


//Loading audio file for sound effects
const clickSound = new Audio('click.mp3');
const transitionSound = new Audio('swap.mp3');

//Setting up margins and dimensions for the SVG
var margin = {top: 20, right: 20, bottom: 30, left: 40};

var width = 1600 - margin.left - margin.right;
var height = 600 - margin.top - margin.bottom;

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)     
    .attr("height", height + margin.top + margin.bottom)  


// Scales for the x and y axes, as well as for triangle dimensions and color
var yScale = d3.scaleLinear().range([0, height]);
var xScale = d3.scaleLinear().range([0, width]);
var baseScale = d3.scaleLinear().range([10, 150]);
var heightScale = d3.scaleLinear().range([10, 150]);
var hueScale = d3.scaleLinear().range([0, 360]);

// Functions to update the scales' domains
function updateXScaleDomain(domain){
    xScale.domain(domain);
}

function updateYScaleDomain(domain){
    yScale.domain(domain);
}

function updateBaseScaleDomain(maxBaseValue){
    baseScale.domain([0, maxBaseValue]);
}
function updateHeightScaleDomain(maxHeightValue){
    heightScale.domain([0, maxHeightValue]);
}

function updateHueScaleDomain(maxHueValue){
    hueScale.domain([0, maxHueValue]);
}

// Array to keep track of selected triangles for swapping
var selected_triangles = []

// Centralized triangle drawing/updating logic
// This function updates the triangles based on the dataset
// It uses D3's data join pattern to handle enter, update, and exit selections
// The function also handles mouse events and click events for triangle swapping

function updateTriangles(dataset) {
    // Data join
    var triangles = d3.select("svg")
        .selectAll("polygon")
        .data(dataset);

    // Exit: remove old elements
    triangles.exit().remove();

    // Enter: create new elements without transition
    var trianglesEnter = triangles.enter()
        .append("polygon")
        .attr("points", function(d) {
            var top = [xScale(d.x), yScale(d.y)];
            var left = [xScale(d.x) - baseScale(d.base) / 2, yScale(d.y) + heightScale(d.height)];
            var right = [xScale(d.x) + baseScale(d.base) / 2, yScale(d.y) + heightScale(d.height)];
            return top + " " + left + " " + right;
        })
        .attr("fill", function(d) {
            return "hsl(" + hueScale(d.hue) + ", 90%, 50%)";
        })
        .attr("stroke", "black")
        .attr("stroke-width", 3)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Update: apply transition only to existing elements
    triangles.transition()
        .duration(1000)
        .attr("points", function(d) {
            var top = [xScale(d.x), yScale(d.y)];
            var left = [xScale(d.x) - baseScale(d.base) / 2, yScale(d.y) + heightScale(d.height)];
            var right = [xScale(d.x) + baseScale(d.base) / 2, yScale(d.y) + heightScale(d.height)];
            return top + " " + left + " " + right;
        })
        .attr("fill", function(d) {
            return "hsl(" + hueScale(d.hue) + ", 90%, 50%)";
        })
        .attr("stroke", "black")
        .attr("stroke-width", 3)
        .on("start", function() {
            transitionSound.currentTime = 0;
            transitionSound.play();
        });

    // Events on both enter + update
    trianglesEnter.merge(triangles)
        .on("mouseover", function(event, d) {
            d3.select(this)
                .attr("fill", "hsl(" + hueScale(d.hue) + ", 40%, 50%)"); //Reducing saturation on hover
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .attr("fill", "hsl(" + hueScale(d.hue) + ", 90%, 50%)"); //Restoring original saturation on mouse out
        })
        .on("click", function(event, d) { // Handle click events for triangle selection and swapping
            clickSound.currentTime = 0;
            clickSound.play();

            var index = selected_triangles.indexOf(d); // Check if the triangle is already selected
            // If the triangle is already selected, remove it from the selection

            if (index > -1) {
                selected_triangles.splice(index, 1);
                d3.select(this)
                    .attr("stroke", "black")
                    .attr("stroke-width", 3);
            } else {
                if (selected_triangles.length < 2) { // If less than 2 triangles are selected, add the current triangle
                    selected_triangles.push(d);
                    d3.select(this)
                        .attr("stroke", "#00FFFF")
                        .attr("stroke-width", 7); // Highlight selected triangle using cyan bigger stroke
                }
            }

            if (selected_triangles.length === 2) { // If two triangles are selected, swap their base and height
                var t1 = selected_triangles[0];
                var t2 = selected_triangles[1];
                var tempBase = t1.base, tempHeight = t1.height;
                t1.base = t2.base;
                t1.height = t2.height;
                t2.base = tempBase;
                t2.height = tempHeight;
                selected_triangles = [];

                updateTriangles(dataset); // trigger update
            }
        });
}

// Load the JSON data and set up the scales based on the data after JSON is loaded
// This will ensure that the triangles are drawn correctly based on the data
d3.json("triangles.json").then(function(data) {
    // Extracting min and max values for x, y, base, height, and hue
    const minX = d3.min(data, d => d.x);
    const maxX = d3.max(data, d => d.x);
    const minY = d3.min(data, d => d.y);
    const maxY = d3.max(data, d => d.y);
    const maxBase = d3.max(data, d => d.base);
    const maxHeight = d3.max(data, d => d.height);

    updateBaseScaleDomain(maxBase);
    updateHeightScaleDomain(maxHeight);

    // Set the distance that the triangles will be padded from the edges of the SVG
    const paddingBase = maxBase / 2;
    const paddingHeight = maxHeight;

    // To avoid clipping issues, we add some padding to the x and y domains
    // This ensures that triangles are fully visible within the SVG area
    // The padding is based on the maximum base and height values
    updateXScaleDomain([minX - paddingBase, maxX + paddingBase]);
    updateYScaleDomain([minY, maxY + paddingHeight]);
    updateHueScaleDomain(d3.max(data, d => d.hue));

    // Call the function to update triangles with the loaded data and handles initial drawing and later updates
    updateTriangles(data);
});




