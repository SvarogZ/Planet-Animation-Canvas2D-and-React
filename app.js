// data to be received from somewhere
const DATA_TO_SHOW = JSON.parse(`{
		"stars":[
			{
				"id":24865,
				"shownX":50,
				"shownY":50,
				"radius":3,
				"color":16766720,
				"brightness":100,
				"name":"Sol"
			},
			{
				"id":24865,
				"shownX":60,
				"shownY":60,
				"radius":4,
				"color":16266720,
				"brightness":100,
				"name":"Sol"
			},
			{
				"id":2655,
				"shownX":200,
				"shownY":200,
				"radius":20,
				"color":16766720,
				"brightness":100,
				"name":"Sol",
				"planets":[
					{
						"id":1,
						"orbit":40,
						"radius":5,
						"color":6923772,
						"name":"Sol",
						"owner":"Sol"
					},
					{
						"id":2,
						"orbit":60,
						"radius":10,
						"color":3381555,
						"name":"Sol",
						"owner":"Sol"
					},
					{
						"id":3,
						"orbit":120,
						"radius":15,
						"color":13382553,
						"name":"Sol",
						"owner":"Sol"
					},
					{
						"id":4,
						"orbit":150,
						"radius":3,
						"color":16766720,
						"name":"Sol",
						"owner":"Sol"
					}
				]
			}
		]
	}
`);

// function to translate hex color to rgba
// works with 6 digit numbers only
// able to shift color in the black or white direction
const hex2rgba = (hex, alpha = 1, shift = 0) => {
	const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
	return `rgba(${r+shift},${g+shift},${b+shift},${alpha})`;
}

// to get a random number from given diapason (not used in the code below)
function random(min,max,bInteger=true){
    const r = (max-min) * Math.random() + min;
	return bInteger ? Math.floor(r) : r;
}

// to translate value from one range to another (not used in the code below)
function mapper(value, smin, smax, dmin, dmax){
        return ((value-smin) / (smax-smin)) * (dmax-dmin) + dmin;
}

// to arrange planets from closest to farthest and visa versa
function arrangePlanets (planets, bReverse) {
	let newPlanets = planets; 
	
	newPlanets && bReverse && newPlanets.sort((a, b) => a.orbit - b.orbit);
	newPlanets && !bReverse && newPlanets.sort((a, b) => b.orbit - a.orbit);

	return newPlanets;
}

// to draw one planet
function drawPlanet(ctx, starX, starY, ellipse, ellipseAngle, rotation, planet, timestamp, bInFrontOf) {
	const { id,orbit,radius,color,name,owner } = planet;
	
	// get planet initial position and speed from timestamp and orbit as a seed
	const angle = (timestamp/orbit/orbit + orbit);
	
	// to draw orbit paths behind the star only
	if (!bInFrontOf) {
		ctx.beginPath();
		ctx.strokeStyle = "rgba(255,255,255,0.25)";
		ctx.ellipse(starX, starY, orbit, orbit*ellipse, ellipseAngle, 0, Math.PI * 2); 
		ctx.stroke();
	}
	
	// get unscaled coordinates of the planet
	const dy = rotation * ellipse * Math.sin(angle);// ecliptic orbit and direction
	// switch to draw the planet behind or in front of the star
	if (bInFrontOf && dy < 0 || !bInFrontOf && dy >= 0) { return; }
	const dx = Math.cos(angle);
	
	// to turn elliptic orbits
	dr = Math.sqrt(dx*dx+dy*dy);
	const modEclAngle = Math.acos(dx/dr);
	const eclAngle = dy > 0 ? modEclAngle : -modEclAngle;
	edx = dr * Math.cos(eclAngle + ellipseAngle);
	edy = dr * Math.sin(eclAngle + ellipseAngle);
	
	// scaled coordinates
	const sx = edx * orbit;
	const sy = edy * orbit;
	
	// shifted to the star location coordinates
	const x = sx + starX;
	const y = sy + starY;
	
	// translate color from decimal to hex
	const color16 = '#' + color.toString(16);
	
	// gradient for the planet
	const grdPlanet = ctx.createRadialGradient(x, y, 0, x, y, radius);
	grdPlanet.addColorStop(0, color16);
	grdPlanet.addColorStop(0.8, hex2rgba(color16, 1, 30));
	grdPlanet.addColorStop(1, "rgba(255,255,255,0)");
	
	// draw planet
	ctx.fillStyle = grdPlanet;
	ctx.beginPath();
	ctx.arc(x,y,radius,0,Math.PI * 2);
	ctx.fill();
	
	// calculation of shadow shift depending on planet position
	const shadowShift = (1 - ellipse) * radius;
	const shy = sy - shadowShift;
	
	// calculation of shadow gradient
	const shadoworbit = Math.sqrt(sx * sx + shy * shy);
	const shadowMinorbit = shadoworbit > radius ? shadoworbit - radius : 0;
	const grdShadow = ctx.createRadialGradient(starX, starY, shadowMinorbit, starX, starY, shadoworbit+radius);
	grdShadow.addColorStop(0, hex2rgba(color16, 0));
	grdShadow.addColorStop(1, "rgba(0,0,0,1)");
	
	// draw shadow
	ctx.fillStyle = grdShadow;
	ctx.beginPath();
	ctx.arc(x,y,radius,0,Math.PI * 2);
	ctx.fill();
}

// to draw all planets for the one star
function drawPlanets(ctx, starX, starY, ellipse, ellipseAngle, rotation, planets, timestamp, bInFrontOf) {
	
	const arrangedPlanets = planets && arrangePlanets(planets, bInFrontOf);
	
	arrangedPlanets && arrangedPlanets.forEach( planet => {
		drawPlanet(ctx, starX, starY, ellipse, ellipseAngle, rotation, planet, timestamp, bInFrontOf);
	});
}

// to draw the star
function drawStar(ctx, star, timestamp) {
	const { id,shownX,shownY,radius,color,brightness,planets } = star;
	
	// translate color from decimal to hex
	const color16 = '#' + color.toString(16);
	
	let fillStyle = color16;
	
	// for complex representation with gradient
	if (radius > 3) {
		const innerRadius = 0,
			outerRadius = radius;

		// Create gradient
		const grd = ctx.createRadialGradient(shownX, shownY, innerRadius, shownX, shownY, outerRadius);
		grd.addColorStop(0, color16);
		grd.addColorStop(0.7, hex2rgba(color16, 1, 30));
		grd.addColorStop(1, "rgba(255,255,255,0)");
		
		fillStyle = grd;
	}
	
	// get parameters of the orbit from the star parameters as a seed
	const ellipse = (Math.cos(id/radius + color)+1.5)/2.5;
	//const ellipse = 0.2// from 0.2 to 1
	const ellipseAngle = Math.sin(id/radius + color)/2;
	//const ellipseAngle = -0.1; // from -0.5 to 0.5 
	//const rotation = -1;
	const rotation = Math.cos(id/radius) < 0 ? -1 : 1;
	
	// draw planets behind the star
	if (radius > 10 && planets) {
		drawPlanets(ctx, shownX, shownY, ellipse, ellipseAngle, rotation, planets, timestamp, false)
	}
	
	// draw the star
	ctx.beginPath()
	ctx.fillStyle = fillStyle;
	ctx.arc(shownX, shownY, radius, 0, 2 * Math.PI);
	ctx.closePath();
	ctx.fill();
	
	// draw planets in front of the star
	if (radius > 10 && planets) {
		drawPlanets(ctx, shownX, shownY, ellipse, ellipseAngle, rotation, planets, timestamp, true)
	}
}


// react class allows propramm to not redraw the canvas frame all the time
class PureCanvas extends React.Component {
  shouldComponentUpdate() { return false; }
  
  render() {
    /*return (
      <canvas width="300" height="300" 
        ref={node => node ? this.props.contextRef(node.getContext('2d')) : null}
      />
    )*/
	
	return React.createElement("canvas", {
		width: this.props.width,
		height: this.props.height,
		ref: node => node ? this.props.contextRef(node.getContext('2d')) : null
		});
  }
}

// react canvas class
class Canvas extends React.Component {
  constructor(props) {
    super(props);
    this.saveContext = this.saveContext.bind(this);
  }
  
  saveContext(ctx) {
    this.ctx = ctx;
  }
  
  componentDidUpdate() {
    const ctx = this.ctx;
	const {timestamp, timedelta, data} = this.props;
	
	ctx.fillStyle = "#000";
	ctx.fillRect(0, 0, 500, 500);
	
	data && data.stars && data.stars.forEach( star => {
		drawStar(ctx, star, timestamp);
	});
  }
  
  render() {
    //return <PureCanvas contextRef={this.saveContext}></PureCanvas>;
	return React.createElement(PureCanvas, { 
		contextRef: this.saveContext,
		width: this.props.width,
		height: this.props.height
		});
  }
}

// react animation class to start and stop render
class Animation extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
		timestamp: 0,
		timedelta: 0
	};
    this.updateAnimationState = this.updateAnimationState.bind(this);
  }
  
  componentDidMount() {
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }
  
  updateAnimationState(timestamp) {
	this.setState(prevState => ({ 
		timedelta: timestamp - prevState.timestamp,
		timestamp
		}));
    this.rAF = requestAnimationFrame(this.updateAnimationState);
  }
  
  componentWillUnmount() {
    cancelAnimationFrame(this.rAF);
  }
  
  render() {
    const {timestamp, timedelta} = this.state;
	const {width, height, data, startTime} = this.props;
	
	//return <Canvas angle={this.state.angle} />
	return React.createElement(Canvas, { 
	timestamp: timestamp + startTime,
	timedelta: timedelta,
	width: width,
	height: height,
	data: data
	});
  }
}


class App extends React.Component {
  /*render() {
    return <div>
      <Animation></Animation>
    </div>;
  }*/
  
  render() {
	return React.createElement("div",null,
			React.createElement(Animation, {
				data: DATA_TO_SHOW,
				width: 400,
				height: 400,
				startTime: 5000
				})
		);
  }
}


//ReactDOM.render(<App />, document.getElementById('root'));
ReactDOM.render(React.createElement(App), document.getElementById('root'));
