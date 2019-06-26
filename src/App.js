import React, { Component } from 'react';
import './App.css';
import { Typography, Button, AppBar, Toolbar } from '@material-ui/core';
import { withStyles } from '@material-ui/styles';
import WriteDemo from './WriteDemo';
import SketchDemo from './SketchDemo';
import { Route, Switch } from "react-router-dom";

const styles = () => ({
  menuButton: {
    marginLeft: -12,
    marginRight: 20,
    height: 50,
  },
  root: {
    height: "100vh"
  },
  grow: {
    flexGrow: 1,
  },
});

class App extends Component {
  constructor(props) {
    super(props);
  }
  render(){
    const {classes} = this.props;

    return (
      <div className="root">
        <AppBar position="">
          <Toolbar>
            <a aria-label="Menu" href="/">
              <img className={classes.menuButton} src="/examples/A_5.svg" />
            </a>
            <Typography variant="h6" color="inherit" className={classes.grow}>
              Bark Face
            </Typography>
            <Button color="inherit" href="#/sketch">
              Sketch
            </Button>
            <Button color="inherit" href="#/write">
              Write
            </Button>
          </Toolbar>
        </AppBar>  
        <Switch>
          <Route path="/sketch" component={SketchDemo} />
          <Route component={WriteDemo} />        
        </Switch>  
      </div>
    );
  }
}

export default withStyles(styles)(App);
