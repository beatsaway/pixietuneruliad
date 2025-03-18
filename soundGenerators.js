// soundGenerators.js


// Flags to track transitions

let transitionDuration = 2; // How many bars to complete transition (can be configurable)

// Generate new random target values for ADSR
function setRandomADSRTargets() {
    // Generate new random values
    targetAdsrValues = {
        attack: Math.random(),
        decay: Math.random(),
        sustain: Math.random(),
        release: Math.random()
    };
    
    // Start the transition
    isTransitioning = true;
    transitionStartBar = totalElapsedBars;
    
    // Optional: Display a notification that randomization is happening
    showNotification("ADSR Randomizing...");
}

// Update ADSR values for gradual transition
function updateADSRTransition() {
    if (!isTransitioning) return;
    
    // Calculate progress (0 to 1)
    const transitionProgress = Math.min(
        (totalElapsedBars - transitionStartBar) / transitionDuration, 
        1
    );
    
    // If transition is complete, stop transitioning
    if (transitionProgress >= 1) {
        isTransitioning = false;
        adsrValues = {...targetAdsrValues};
        updateADSRSliders();
        return;
    }
    
    // Interpolate between original and target values
    adsrValues = {
        attack: interpolate(adsrValues.attack, targetAdsrValues.attack, transitionProgress),
        decay: interpolate(adsrValues.decay, targetAdsrValues.decay, transitionProgress),
        sustain: interpolate(adsrValues.sustain, targetAdsrValues.sustain, transitionProgress),
        release: interpolate(adsrValues.release, targetAdsrValues.release, transitionProgress)
    };
    
    // Update sliders to reflect current values
    updateADSRSliders();
}

// Helper function for value interpolation with easing
function interpolate(start, end, progress) {
    // Ease in/out cubic function for smoother transition
    progress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    return start + (end - start) * progress;
}

// Update slider values to reflect current ADSR values
function updateADSRSliders() {
    document.getElementById('attackSlider').value = adsrValues.attack;
    document.getElementById('decaySlider').value = adsrValues.decay;
    document.getElementById('sustainSlider').value = adsrValues.sustain;
    document.getElementById('releaseSlider').value = adsrValues.release;
    
    // Update values for calculations
    attackRatio = adsrValues.attack;
    decayRatio = adsrValues.decay;
    sustainLevel = adsrValues.sustain;
    releaseRatio = adsrValues.release;
    
    updateADSRDisplay();
}

// Show a temporary notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 2000);
}

// Modify the existing checkRandomization function
function checkRandomization() {
    const randomizeKey = document.getElementById('randomizeKeyCheck').checked;
    const randomizeKeyBars = parseInt(document.getElementById('randomizeKeyBars').value);
    const randomizeChord = document.getElementById('randomizeChordCheck').checked;
    const randomizeChordBars = parseInt(document.getElementById('randomizeChordBars').value);
    const randomizeBalls = document.getElementById('randomizeBallsCheck').checked;
    const randomizeBallsBars = parseInt(document.getElementById('randomizeBallsBars').value);
    const randomizeBallsCount = parseInt(document.getElementById('randomizeBallsCount').value);
    const randomizeADSR = document.getElementById('randomizeADSRCheck').checked;
    const randomizeADSRBars = parseInt(document.getElementById('randomizeADSRBars').value);

    // Update ADSR transition on every frame during playback
    if (isTransitioning) {
        updateADSRTransition();
    }
    
    if (randomizeBalls && totalElapsedBars % randomizeBallsBars === 0) {
        randomizeBallStates(randomizeBallsCount);
    }
    
    if (randomizeKey && totalElapsedBars % randomizeKeyBars === 0) {
        const randomKeyIndex = Math.floor(Math.random() * keys.length);
        document.getElementById('keySelect').value = randomKeyIndex;
    }

    if (randomizeChord && totalElapsedBars % randomizeChordBars === 0) {
        const randomChordIndex = Math.floor(Math.random() * chords.length);
        document.getElementById('chordSelect').value = randomChordIndex;
    }
    
    // Trigger ADSR randomization at appropriate intervals
    if (randomizeADSR && totalElapsedBars % randomizeADSRBars === 0 && !isTransitioning) {
        setRandomADSRTargets();
    }

    if (randomizeKey || randomizeChord) {
        assignNotes();
    }
}

// Replace the existing randomizeADSRValues function
function randomizeADSRValues() {
    // Instead of directly setting values, set target values and start transition
    setRandomADSRTargets();
}

// Add a transition duration setting to the randomize popup
function addTransitionDurationSetting() {
    const randomizePopup = document.getElementById('randomizePopup');
    const closeButton = document.getElementById('closePopup');
    
    const transitionSetting = document.createElement('div');
    transitionSetting.innerHTML = `
        <input type="checkbox" id="gradualADSRCheck" checked>
        <label for="gradualADSRCheck">Gradual ADSR transitions over</label>
        <select id="adsrTransitionBars">
            <option value="1">1</option>
            <option value="2" selected>2</option>
            <option value="4">4</option>
            <option value="8">8</option>
        </select> bars
    `;
    
    randomizePopup.insertBefore(transitionSetting, closeButton);
    
    document.getElementById('gradualADSRCheck').addEventListener('change', function() {
        transitionDuration = this.checked ? 
            parseInt(document.getElementById('adsrTransitionBars').value) : 
            0;
    });
    
    document.getElementById('adsrTransitionBars').addEventListener('change', function() {
        if (document.getElementById('gradualADSRCheck').checked) {
            transitionDuration = parseInt(this.value);
        }
    });
}

// Call this function during initialization
document.addEventListener('DOMContentLoaded', function() {
    addTransitionDurationSetting();
});


function changeSoundGenerator() {
        currentSoundGenerator = document.getElementById('soundSelect').value;
        
        // Stop all current oscillators
        balls.forEach(ball => {
            ball.oscillator.stop();
        });
        
        // Create new oscillators with the selected type
        balls.forEach(ball => {
            const oscillator = SoundGenerators[currentSoundGenerator](audioContext);
            oscillator.frequency.setValueAtTime(ball.oscillator.frequency.value, audioContext.currentTime);
            oscillator.connect(ball.gainNode);
            oscillator.start();
            ball.oscillator = oscillator;
        });
        
        // Re-assign notes to update frequencies
        assignNotes();
    }

    function setupControls() {
        const chordSelect = document.getElementById('chordSelect');
        chords.forEach((chord, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = chord.name;
            chordSelect.appendChild(option);
        });

        const keySelect = document.getElementById('keySelect');
        keys.forEach((key, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = key;
            keySelect.appendChild(option);
        });

        const soundSelect = document.getElementById('soundSelect');
        Object.keys(SoundGenerators).forEach((sound) => {
            const option = document.createElement('option');
            option.value = sound;
            option.textContent = sound.charAt(0).toUpperCase() + sound.slice(1);
            soundSelect.appendChild(option);
        });

        chordSelect.addEventListener('change', assignNotes);
        keySelect.addEventListener('change', assignNotes);
        soundSelect.addEventListener('change', changeSoundGenerator);
        document.getElementById('bpmInput').addEventListener('change', updateADSRSliderMaxes);

        document.getElementById('volumeSlider').addEventListener('input', function() {
            masterGainNode.gain.setValueAtTime(this.value, audioContext.currentTime);
        });

        setupRandomizeControls();
        updateADSRSliderMaxes();
    }

    function setupRandomizeControls() {
        const randomizeKeyBars = document.getElementById('randomizeKeyBars');
        const randomizeChordBars = document.getElementById('randomizeChordBars');
        const randomizeBallsBars = document.getElementById('randomizeBallsBars');
        const randomizeADSRBars = document.getElementById('randomizeADSRBars');
        
        for (let i = 1; i <= 24; i++) {
            const optionKey = document.createElement('option');
            optionKey.value = i;
            optionKey.textContent = i;
            randomizeKeyBars.appendChild(optionKey);

            const optionChord = document.createElement('option');
            optionChord.value = i;
            optionChord.textContent = i;
            randomizeChordBars.appendChild(optionChord);
            
            const optionBalls = document.createElement('option');
            optionBalls.value = i;
            optionBalls.textContent = i;
            randomizeBallsBars.appendChild(optionBalls);
            
            const optionADSR = document.createElement('option');
            optionADSR.value = i;
            optionADSR.textContent = i;
            randomizeADSRBars.appendChild(optionADSR);
        }

        document.getElementById('diceButton').addEventListener('click', function() {
            document.getElementById('randomizePopup').style.display = 'block';
            
            // Set gradual ADSR checkbox state based on randomize ADSR checkbox
            const randomizeADSRCheck = document.getElementById('randomizeADSRCheck');
            const gradualADSRCheck = document.getElementById('gradualADSRCheck');
            
            gradualADSRCheck.disabled = !randomizeADSRCheck.checked;
            if (!randomizeADSRCheck.checked) {
                gradualADSRCheck.checked = false;
            }
        });

        document.getElementById('closePopup').addEventListener('click', function() {
            document.getElementById('randomizePopup').style.display = 'none';
        });

        // Link ADSR randomization and gradual transition
        document.getElementById('randomizeADSRCheck').addEventListener('change', function() {
            const gradualADSRCheck = document.getElementById('gradualADSRCheck');
            gradualADSRCheck.disabled = !this.checked;
            if (!this.checked) {
                gradualADSRCheck.checked = false;
            }
        });
    }

    function setupBalls() {
        const container = document.getElementById('ballContainer');
        rhythms.forEach((rhythm, i) => {
            // Create a wrapper div to contain both the ball and the dropdown
            const wrapper = document.createElement('div');
            wrapper.className = 'ball-wrapper';
            
            // Create the ball element
            const ball = document.createElement('div');
            ball.className = 'ball';
            ball.innerHTML = `${rhythm.name}<br><span class="note-display"></span>`;
            ball.addEventListener('click', () => toggleBall(i));
            
            // Create the miss chance dropdown outside the ball
            const missChanceSelect = document.createElement('select');
            missChanceSelect.className = 'miss-chance';
            missChanceSelect.setAttribute('data-ball-index', i);
            
            // Add options to the dropdown
            const options = [
                { value: "0", text: "0% miss" },
                { value: "25", text: "25% miss" },
                { value: "33", text: "33% miss" },
                { value: "50", text: "50% miss" },
                { value: "66", text: "66% miss" },
                { value: "75", text: "75% miss" }
            ];
            
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.text;
                missChanceSelect.appendChild(option);
            });
            
            // Add event listener for miss chance dropdown
            missChanceSelect.addEventListener('change', function() {
                balls[i].missChance = parseInt(this.value);
            });
            
            // Add the ball and dropdown to the wrapper
            wrapper.appendChild(ball);
            wrapper.appendChild(missChanceSelect);
            
            // Add the wrapper to the container
            container.appendChild(wrapper);

            // Create the audio components
            const oscillator = SoundGenerators[currentSoundGenerator](audioContext);
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(masterGainNode);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            oscillator.start();

            // Store references to the elements and audio components
            balls.push({ 
                element: ball, 
                oscillator,
                gainNode, 
                active: i === 3,
                rhythm: rhythm,
                lastPlayTime: 0,
                noteNameElement: ball.querySelector('.note-display'),
                missChance: 0
            });

            if (i === 3) ball.classList.add('active');
        });
    }

    function toggleBall(index) {
        balls[index].active = !balls[index].active;
        balls[index].element.classList.toggle('active');
    }

    function assignNotes() {
        const chordIndex = document.getElementById('chordSelect').value;
        const keyIndex = document.getElementById('keySelect').value;
        const baseNote = 60 + parseInt(keyIndex); // Middle C is 60
        const chordIntervals = chords[chordIndex].intervals;

        balls.forEach((ball, index) => {
            const noteIndex = chordIntervals[index % chordIntervals.length];
            const octave = Math.floor(index / chordIntervals.length);
            const note = baseNote + noteIndex + (octave * 12);
            const frequency = 220 * Math.pow(2, (note - 69) / 12);
            
            ball.oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
            ball.noteNameElement.textContent = keys[(note % 12)];
        });
    }

    // Update ADSR slider maxes based on BPM
    function updateADSRSliderMaxes() {
        const bpm = parseInt(document.getElementById('bpmInput').value);
        const maxTime = 120 / bpm; // Maximum combined ADSR time in seconds
        
        const maxAttackRatio = 0.3; // 30% of max time
        const maxDecayRatio = 0.3;  // 30% of max time
        const maxReleaseRatio = 0.4; // 40% of max time
        
        const attackSlider = document.getElementById('attackSlider');
        const decaySlider = document.getElementById('decaySlider');
        const releaseSlider = document.getElementById('releaseSlider');
        
        // Update slider values proportionally if they exceed new max values
        if (adsrValues.attack > maxAttackRatio) {
            adsrValues.attack = maxAttackRatio;
            attackSlider.value = maxAttackRatio;
        }
        
        if (adsrValues.decay > maxDecayRatio) {
            adsrValues.decay = maxDecayRatio;
            decaySlider.value = maxDecayRatio;
        }
        
        if (adsrValues.release > maxReleaseRatio) {
            adsrValues.release = maxReleaseRatio;
            releaseSlider.value = maxReleaseRatio;
        }
        
        updateADSRDisplay();
    }
    
    function updateADSRDisplay() {
        const bpm = parseInt(document.getElementById('bpmInput').value);
        const maxTime = 120 / bpm;
        
        const attackTime = adsrValues.attack * maxTime * 0.3;
        const decayTime = adsrValues.decay * maxTime * 0.3;
        const releaseTime = adsrValues.release * maxTime * 0.4;
        
        const totalTime = attackTime + decayTime + releaseTime;
        document.getElementById('adsrTotalTime').textContent = `Note Duration: ${totalTime.toFixed(2)}s (Max: ${maxTime.toFixed(2)}s)`;
    }

    // Set up ADSR slider event listeners
    document.getElementById('attackSlider').addEventListener('input', function() {
        adsrValues.attack = parseFloat(this.value);
        updateADSRDisplay();
    });

    document.getElementById('decaySlider').addEventListener('input', function() {
        adsrValues.decay = parseFloat(this.value);
        updateADSRDisplay();
    });

    document.getElementById('sustainSlider').addEventListener('input', function() {
        adsrValues.sustain = parseFloat(this.value);
        updateADSRDisplay();
    });

    document.getElementById('releaseSlider').addEventListener('input', function() {
        adsrValues.release = parseFloat(this.value);
        updateADSRDisplay();
    });
    
    // Generate new random target values for ADSR with gradual transition
    function setRandomADSRTargets() {
        // Generate new random values
        targetAdsrValues = {
            attack: Math.random(),
            decay: Math.random(),
            sustain: Math.random(),
            release: Math.random()
        };
        
        // Start the transition
        isTransitioning = true;
        transitionStartBar = totalElapsedBars;
        
        // Optional: Display a notification that randomization is happening
        showNotification("ADSR Randomizing...");
    }

    // Helper function for value interpolation with easing
    function interpolate(start, end, progress) {
        // Ease in/out cubic function for smoother transition
        progress = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        return start + (end - start) * progress;
    }

    // Update ADSR values for gradual transition
    function updateADSRTransition() {
        if (!isTransitioning) return;
        
        const randomizeADSRBars = parseInt(document.getElementById('randomizeADSRBars').value);
        
        // Calculate progress (0 to 1)
        const transitionProgress = Math.min(
            (totalElapsedBars - transitionStartBar) / randomizeADSRBars, 
            1
        );
        
        // If transition is complete, stop transitioning
        if (transitionProgress >= 1) {
            isTransitioning = false;
            adsrValues = {...targetAdsrValues};
            updateADSRSliders();
            return;
        }
        
        // Interpolate between original and target values
        adsrValues = {
            attack: interpolate(adsrValues.attack, targetAdsrValues.attack, transitionProgress),
            decay: interpolate(adsrValues.decay, targetAdsrValues.decay, transitionProgress),
            sustain: interpolate(adsrValues.sustain, targetAdsrValues.sustain, transitionProgress),
            release: interpolate(adsrValues.release, targetAdsrValues.release, transitionProgress)
        };
        
        // Update sliders to reflect current values
        updateADSRSliders();
    }

    // Update slider values to reflect current ADSR values
    function updateADSRSliders() {
        document.getElementById('attackSlider').value = adsrValues.attack;
        document.getElementById('decaySlider').value = adsrValues.decay;
        document.getElementById('sustainSlider').value = adsrValues.sustain;
        document.getElementById('releaseSlider').value = adsrValues.release;
        
        updateADSRDisplay();
    }

    function randomizeADSRValues() {
        const gradualADSRCheck = document.getElementById('gradualADSRCheck');
        
        // Check if gradual transitions are enabled
        if (gradualADSRCheck.checked) {
            setRandomADSRTargets();
        } else {
            // Immediate change if gradual transitions are disabled
            adsrValues = {
                attack: Math.random(),
                decay: Math.random(),
                sustain: Math.random(),
                release: Math.random()
            };
            updateADSRSliders();
        }
    }

    // Show a temporary notification
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 500);
        }, 2000);
    }

    function calculateADSRTimes() {
        const bpm = parseInt(document.getElementById('bpmInput').value);
        const maxTime = 120 / bpm;
        
        return {
            attack: adsrValues.attack * maxTime * 0.3,
            decay: adsrValues.decay * maxTime * 0.3,
            sustain: adsrValues.sustain,
            release: adsrValues.release * maxTime * 0.4
        };
    }

    function playNote(ball) {
        // Check if we should skip playing this note based on miss chance
        if (ball.missChance > 0) {
            const randomValue = Math.random() * 100;
            if (randomValue < ball.missChance) {
                // Skip playing this note
                return;
            }
        }
        
        const now = audioContext.currentTime;
        const adsr = calculateADSRTimes();
        const noteEndTime = now + adsr.attack + adsr.decay + adsr.release;

        ball.gainNode.gain.cancelScheduledValues(now);
        ball.gainNode.gain.setValueAtTime(0, now);

        // Attack phase
        ball.gainNode.gain.linearRampToValueAtTime(0.25, now + adsr.attack);  // Changed from 1 to 0.25 for -12dB

        // Decay phase
        ball.gainNode.gain.linearRampToValueAtTime(adsr.sustain * 0.25, now + adsr.attack + adsr.decay);  // Multiply sustain by 0.25

        // Sustain phase (note that sustain level is held until the note is released)
        ball.gainNode.gain.setValueAtTime(adsr.sustain * 0.25, now + adsr.attack + adsr.decay);  // Multiply sustain by 0.25

        // Release phase
        ball.gainNode.gain.linearRampToValueAtTime(0, noteEndTime);
    }

    function updateBalls() {
        if (!isPlaying) return;

        const now = audioContext.currentTime;
        const bpm = parseInt(document.getElementById('bpmInput').value);
        const beatDuration = 60 / bpm;
        
        if (!startTime) startTime = now;
        
        const elapsedBeats = (now - startTime) / beatDuration;
        const currentBeat = elapsedBeats % 4; // Assuming 4/4 time signature

        // Calculate total elapsed bars
        const newTotalElapsedBars = Math.floor(elapsedBeats / 4);
        if (newTotalElapsedBars > totalElapsedBars) {
            totalElapsedBars = newTotalElapsedBars;
            checkRandomization();
        }

        balls.forEach((ball) => {
            if (ball.active) {
                const cycleDuration = ball.rhythm.beats * beatDuration;
                if (now - ball.lastPlayTime >= cycleDuration) {
                    playNote(ball);
                    ball.lastPlayTime = now - ((now - ball.lastPlayTime) % cycleDuration);
                    
                    // Update animation duration based on rhythm
                    ball.element.style.animationDuration = (cycleDuration * 0.5) + 's';
                }
                
                if (!ball.element.classList.contains('playing')) {
                    ball.element.classList.add('playing');
                    // Set animation duration based on the ball's rhythm
                    ball.element.style.animationDuration = (ball.rhythm.beats * beatDuration * 0.5) + 's';
                }
            } else {
                ball.element.classList.remove('playing');
            }
        });

        requestAnimationFrame(updateBalls);
    }

    function checkRandomization() {
        const randomizeKey = document.getElementById('randomizeKeyCheck').checked;
        const randomizeKeyBars = parseInt(document.getElementById('randomizeKeyBars').value);
        const randomizeChord = document.getElementById('randomizeChordCheck').checked;
        const randomizeChordBars = parseInt(document.getElementById('randomizeChordBars').value);
        const randomizeBalls = document.getElementById('randomizeBallsCheck').checked;
        const randomizeBallsBars = parseInt(document.getElementById('randomizeBallsBars').value);
        const randomizeBallsCount = parseInt(document.getElementById('randomizeBallsCount').value);
        const randomizeADSR = document.getElementById('randomizeADSRCheck').checked;
        const randomizeADSRBars = parseInt(document.getElementById('randomizeADSRBars').value);

        // Update ADSR transition on every frame during playback
        if (isTransitioning) {
            updateADSRTransition();
        }
        
        if (randomizeBalls && totalElapsedBars % randomizeBallsBars === 0) {
            randomizeBallStates(randomizeBallsCount);
        }
        
        if (randomizeKey && totalElapsedBars % randomizeKeyBars === 0) {
            const randomKeyIndex = Math.floor(Math.random() * keys.length);
            document.getElementById('keySelect').value = randomKeyIndex;
        }

        if (randomizeChord && totalElapsedBars % randomizeChordBars === 0) {
            const randomChordIndex = Math.floor(Math.random() * chords.length);
            document.getElementById('chordSelect').value = randomChordIndex;
        }
        
        // Trigger ADSR randomization at appropriate intervals
        if (randomizeADSR && totalElapsedBars % randomizeADSRBars === 0 && !isTransitioning) {
            randomizeADSRValues();
        }

        if (randomizeKey || randomizeChord) {
            assignNotes();
        }
    }
    
    function randomizeBallStates(count) {
        // First, deactivate all balls
        balls.forEach(ball => {
            ball.active = false;
            ball.element.classList.remove('active');
        });

        // Then, randomly activate 'count' number of balls
        const shuffled = balls.slice().sort(() => 0.5 - Math.random());
        shuffled.slice(0, count).forEach(ball => {
            ball.active = true;
            ball.element.classList.add('active');
        });
    }
    
    document.getElementById('playPauseButton').addEventListener('click', function() {
        isPlaying = !isPlaying;
        this.textContent = isPlaying ? 'Pause' : 'Play';
        if (isPlaying) {
            audioContext.resume();
            startTime = audioContext.currentTime;
            totalElapsedBars = 0;
            requestAnimationFrame(updateBalls);
        } else {
            audioContext.suspend();
            startTime = null;
            balls.forEach(ball => ball.element.classList.remove('playing'));
        }
    });