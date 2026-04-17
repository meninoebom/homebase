# Primer: Jerkiness as windowed variance of acceleration

Target duration: 10 to 15 minutes. Goal: Brandon can explain back, in his own words, why windowed variance of acceleration is the right quantity for "jerkiness" and why the current third-derivative implementation is numerical garbage on noisy pose data.

## The setup

Ralf receives pose data at 30fps: a stream of (x, y) positions per skeleton joint. From positions, we can derive velocities (first derivative) and accelerations (second derivative). The current Ralf code computes "jerkiness" as the third derivative (jerk is literally the rate of change of acceleration).

## Why third derivative is a bad idea on noisy signals

Every derivative step amplifies high-frequency noise. If the raw position signal has small measurement jitter from MediaPipe, the velocity signal has bigger jitter, the acceleration signal has jitter that looks like a shouting match, and the third derivative is pure noise with occasional signal peeking through. Differentiation is a high-pass filter, three stacked high-pass filters do what three stacked high-pass filters do.

On fast motion (a dancer in capoeira ginga at full speed), this produces NaNs and wild spikes that do not correspond to any real quality of the movement.

## The better quantity

"Jerkiness" as a movement quality is not literally the third derivative. It is the degree to which a dancer's acceleration varies from moment to moment. A dancer moving smoothly has low variance in acceleration. A dancer stabbing, jerking, or shuddering has high variance in acceleration.

So the operational definition:

    jerkiness(t) = variance of acceleration over a window ending at t

Windowed variance is two derivative steps (for acceleration) plus one aggregation step (variance). The variance acts as a low-pass-adjacent operation: it cares about magnitude of fluctuation, not instantaneous jitter. This is why it works on noisy data where the third derivative does not.

## Worked example

Take a 1D position stream for simplicity (the 2D case is just two coordinates):

    positions:    x[0], x[1], x[2], ... x[n-1]    at 30fps, dt = 1/30

    velocity:     v[i] = (x[i] - x[i-1]) / dt
    acceleration: a[i] = (v[i] - v[i-1]) / dt

    window_size = W  (pick W = 15 frames for 0.5 second window at 30fps)

    for each t >= W:
        window = a[t-W+1 : t+1]       // last W acceleration samples
        jerkiness[t] = variance(window)

That is it. Variance is mean of (x - mean)^2 over the window. Naive implementation recomputes mean and variance from scratch each frame.

A good implementation uses **Welford's online algorithm** to update the running mean and variance as the window slides (adding one new sample, dropping one old sample) without recomputing from scratch. That is for Rep 004. For Rep 001, a naive windowed variance is fine.

## Ralf quality API

Ralf's quality pipeline outputs values in the 0-1 range, normalized by `AdaptiveRange`. The raw variance output from this rep will be an absolute number in units of (pixels / second^2)^2. That feeds into `AdaptiveRange` which maps the observed min/max over a warmup window to 0-1. Rep 001 just needs to produce the raw number correctly. The normalization is Ralf's existing concern.

## What Brandon writes in Phase 4

`solve.py` reads a recorded pose session (CSV or JSON, format TBD when Brandon starts — he can pick the simplest). Reads frames in order. Emits the jerkiness value at each frame after the window is full.

Validation: compare output against the existing Ralf Rust implementation on the same recorded session. Expect them to differ (that is the point — the existing implementation has the bug).

## What to predict in Phase 3

- Time: O(n * W) with naive windowed variance (recomputes over each window). With Welford-style online stats: O(n).
- Space: O(W) for the window buffer.

Brandon should commit to one explicit pair before Phase 4.

## Extension seed for Phase 6

What happens if Ralf has to run this on 20 dancers simultaneously at 30fps. How much memory per dancer. How much CPU per dancer. Does the naive O(n*W) still fit in the frame budget.
