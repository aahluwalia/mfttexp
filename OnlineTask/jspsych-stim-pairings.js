/**
 * jspsych-single-stim
 * Josh de Leeuw
 *
 * plugin for displaying a stimulus and getting a keyboard response
 *
 * documentation: docs.jspsych.org
 *
 **/


jsPsych.plugins["stim-pairings"] = (function() {

  var plugin = {};

  jsPsych.pluginAPI.registerPreload('stim-pairings', 'stimuli', 'image');

  plugin.trial = function(display_element, trial) {

    // if any trial variables are functions
    // this evaluates the function and replaces
    // it with the output of the function
    trial = jsPsych.pluginAPI.evaluateFunctionParameters(trial);

    // set default values for the parameters
    trial.choices = trial.choices || [];
    trial.response_ends_trial = (typeof trial.response_ends_trial == 'undefined') ? true : trial.response_ends_trial;
    trial.timing_stim = trial.timing_stim || -1;
    trial.timing_response = trial.timing_response || -1;
    trial.is_html = (typeof trial.is_html == 'undefined') ? false : trial.is_html;
    trial.prompt = trial.prompt || "";

    // this array holds handlers from setTimeout calls
    // that need to be cleared if the trial ends early
    var setTimeoutHandlers = [];

    //show prompt if there is one
    if (trial.prompt !== "") {
      display_element.append(trial.prompt);
    }


    // unpack the stimuli array
    trial.word1 = trial.stimuli[0];
    trial.word2 = trial.stimuli[1];

    function showStimulus() {

      // randomize whether the target is on the left or the right
      var pairing = [trial.word1, trial.word2];
      var stim_order = (Math.floor(Math.random() * 2) === 0); // 50% chance target is on left.
      if (!stim_order) {
        pairing = [trial.word2, trial.word1],
        trial.wordL = trial.word2,
        trial.WordR = trial.word1;
      } else {
        trial.wordL = trial.word1,
        trial.WordR = trial.word2;
      }

      // show the options
      if (!trial.is_html) {
        display_element.append($('<img>', {
          "src": pairing[0],
          "class": 'jspsych-stim-pairing left'
        }));
        display_element.append($('<img>', {
          "src": pairing[1],
          "class": 'jspsych-stim-pairing right'
        }));
      } else {
        display_element.append($('<div>', {
          "class": 'jspsych-stim-pairing left',
          html: pairing[0]
        }));
        display_element.append($('<div>', {
          "class": 'jspsych-stim-pairing right',
          html: pairing[1]
        }));
      }
    }

    // store response
    var response = {
      rt: -1,
      key: -1
    };

    // function to end trial when it is time
    var end_trial = function() {

      // kill any remaining setTimeout handlers
      for (var i = 0; i < setTimeoutHandlers.length; i++) {
        clearTimeout(setTimeoutHandlers[i]);
      }

      // kill keyboard listeners
      if (typeof keyboardListener !== 'undefined') {
        jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
      }

      // gather the data to store for the trial
      var trial_data = {
        "rt": response.rt,
        "stimuli": trial.stimuli,
        "wordL": trial.wordL
        "WordR": trial.WordR
        "key_press": response.key
      };

      //jsPsych.data.write(trial_data);

      // clear the display
      display_element.html('');

      // move on to the next trial
      jsPsych.finishTrial(trial_data);
    };

    // function to handle responses by the subject
    var after_response = function(info) {

      // only record the first response
      if (response.key == -1) {
        response = info;
      }

      if (trial.response_ends_trial) {
        end_trial();
      }
    };

    // start the response listener
    if (JSON.stringify(trial.choices) != JSON.stringify(["none"])) {
      var keyboardListener = jsPsych.pluginAPI.getKeyboardResponse({
        callback_function: after_response,
        valid_responses: trial.choices,
        rt_method: 'date',
        persist: false,
        allow_held_key: false
      });
    }

    // end trial if time limit is set
    if (trial.timing_response > 0) {
      var t2 = setTimeout(function() {
        end_trial();
      }, trial.timing_response);
      setTimeoutHandlers.push(t2);
    }

  };

  return plugin;
})();
