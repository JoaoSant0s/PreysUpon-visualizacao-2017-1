var ComparativeHistograms = function ()
{
	this.colorGroups = ["Blue", "White", "Green", "Black", "Red", "Multicolored", "Colorless"]; 	
	this.keys = ["Predator", "Trade", "BounceOff", "Prey"];
	this.rarities = ["Common", "Uncommon", "Rare", "Mythic Rare", "Special"];

	var matrizSVG = d3.select(".three").append("svg").attr("width", 300).attr("height", 200);
	var margin = {top: 20, right: 20, bottom: 30, left: 40};		

	this.width = +matrizSVG.attr("width") - margin.left - margin.right;
	this.height = +matrizSVG.attr("height") - margin.top - margin.bottom;
	this.g = matrizSVG.append("g");

	this.tooltipDiv = d3.select("body").append("div")
	    .attr("class", "tooltip");

	this.tooltipDiv.append("ul");

	this.colorsRarity = d3.scaleOrdinal()
		.range(["#FFFFFF", "#7a7a7a", "#efc323", "#d33d02", "#6e04cc"])
    	.domain(this.rarities);

};

ComparativeHistograms.prototype.setHistograms = function (histogram1, histogram2)
{	
    this.histogramLeft = histogram1;
    this.histogramRight = histogram2;      
}

ComparativeHistograms.prototype.comparingHistograms = function() {
	var numberColumns = this.histogramLeft.data.length;	
	var histogramsColors = [];
	for (var i = numberColumns - 1; i >= 0; i--) 
	{		

		var typeLeft = this.histogramLeft.data[i];
		var typeRight = this.histogramRight.data[i];

		var result = {
			color: this.histogramLeft.data[i].key,
			types: [
				{
					id: this.comparingValues(typeLeft.Predator, typeRight.Predator),
					color: this.histogramLeft.data[i].key
				},
				{
					id: this.comparingValues(typeLeft.Trade, typeRight.Trade),
					color: this.histogramLeft.data[i].key
				},
				{
					id: this.comparingValues(typeLeft.BounceOff, typeRight.BounceOff),
					color: this.histogramLeft.data[i].key
				},
				{
					id: this.comparingValues(typeLeft.Prey, typeRight.Prey),
					color: this.histogramLeft.data[i].key
				}										
			]			
		}		

		histogramsColors.push(result);				
	}

	this.buildMatriz(histogramsColors)

};

ComparativeHistograms.prototype.buildMatriz = function(histogramsColors) 
{	

	var x = d3.scaleOrdinal(this.width)	
			.domain(this.colorGroups)
		    .range([65, 95, 125, 155, 185, 215, 245]);		  
		    
	var y = d3.scaleOrdinal(this.height)
			.domain(this.keys)
		    .range([30, 60, 90, 120]);	

	this.scaleColor = d3.scaleOrdinal()
		.domain([-2, -1, this.histogramLeft.histogramIndex, this.histogramRight.histogramIndex])
		.range(["black", "gray", "blue", "green"]);   	


	for (var i = histogramsColors.length - 1; i >= 0; i--) {

		var columns = this.g.selectAll(".column")
		    .append("g")
		    .attr("class", "column");	

	    columns.data(histogramsColors[i].types)		  	
		  	.enter().append("rect")
		    .attr("class", "cell")
		    .attr("x", function(d) { return x(histogramsColors[i].color); })
		    .attr("y", function(d, i) { return y(this.keys[i]); }.bind(this))
		    .attr("width", 20)
		    .attr("height", 20)	    
		    .style("stroke-width", 1)
		    .style("fill", function(d) { return this.scaleColor(d.id); }.bind(this))
		    .on("mouseover", this.onMouseOver.bind(this))
        	.on("mouseout", this.onMouseOut.bind(this));
        			      
	}	
	
	var yText = this.g.selectAll(".textsY").data(this.keys)
		.enter().append("text")
		.attr("x", 0)
		.attr("y", function(d) { return y(d) + 15; })		
		.attr("font-weight", "bold")
		.attr("font-size", 12)
		.text(function(d){return d; });

	var xText = this.g.selectAll(".textsY").data(this.colorGroups)
		.enter().append("text")
		.attr("x", function(d) { return x(d); })
		.attr("y", function(d, i) { return ( (i % 2 == 0)? 15 : (160) ) })
		.attr("font-size", 10)
		.text(function(d){return d; });
};

ComparativeHistograms.prototype.onMouseOver = function(d, index) 
{

	this.tooltipDiv.transition()
        .duration(200)
        .style("opacity", 1)
        .style("left", (d3.event.pageX) + "px")
        .style("top", (d3.event.pageY - 28) + "px");
    
    var colorIndex = this.colorGroups.indexOf(d.color);
	
    var leftResult = null;
    var rightResult = null;

	for (var i = this.histogramLeft.data.length - 1; i >= 0; i--) 
	{
		var left = this.histogramLeft.data[i];
		if(d.color == left.key) leftResult = left;
		
		var right = this.histogramRight.data[i];
		if(d.color == right.key) rightResult = right;		
	}	

	console.log(leftResult);
	console.log(rightResult);
	var cards = [];

	var cardsLeft = leftResult[this.keys[index]].cards;	
	var cardsRight = rightResult[this.keys[index]].cards;

	cards.push.apply(cards, cardsLeft);
	cards.push.apply(cards, cardsRight);
	console.log(cards);	

    cards.sort(function(a, b)
    {
    	var indexA = this.rarities.indexOf(a.rarity);
    	var indexB = this.rarities.indexOf(b.rarity);
    	return indexB - indexA;
    }.bind(this));

    var elements = this.tooltipDiv.select("ul").selectAll("li").data(cards);
    elements.exit().remove();

    var newElements = elements.enter().append("li");

	elements.merge(newElements)
		.text(function(d){return d.cmc + "-" + d.name + "(" + d.power + "/" + d.toughness + ")";})
		.style("color", function(d){return this.colorsRarity(d.rarity);}.bind(this));
};

ComparativeHistograms.prototype.onMouseOut = function(d) 
{
	this.tooltipDiv.transition().duration(500).style("opacity", 0);
};

ComparativeHistograms.prototype.comparingValues = function(typeLeft, typeRight) 
{
	var result = -1;	

	if(typeLeft.cardCount > typeRight.cardCount){
		result = this.histogramLeft.histogramIndex;		
	}else if(typeLeft.cardCount < typeRight.cardCount){
		result = this.histogramRight.histogramIndex;		
	}

	if(typeLeft.cardCount == 0 && typeRight.cardCount == 0) result = -2

	return result;	
};

ComparativeHistograms.prototype.setHistogramLeft = function (histogram)
{
    this.histogramLeft = histogram;    
}

ComparativeHistograms.prototype.setHistogramRight = function (histogram)
{
    this.histogramRight = histogram;    
}

ComparativeHistograms.prototype.returnHistograms = function() 
{
    return [this.histogramLeft, this.histogramRight];
}
