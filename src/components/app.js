import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Home from '../routes/home';
import Game from '../routes/game';
import Loss from '../routes/loss';
import Select from '../routes/select';
import Win from '../routes/win';

export default class App extends Component {
  state = {
    selectedStress: '',
  };

  selectStress = selectedStress => this.setState({ selectedStress });

  render() {
    return (
      <div id="app">
        <Router onChange={this.handleRoute}>
          <Home path="/" />
          <Game path="/game" stress={this.state.selectedStress} />
          <Loss path="/loss" />
          <Select path="/select" onSelectStress={this.selectStress} />
          <Win path="/win" />
        </Router>
      </div>
    );
  }
}
