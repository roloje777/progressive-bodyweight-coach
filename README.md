# PBH --- Progressive Bodyweight Hypertrophy Coach

PBH is a mobile-first bodyweight hypertrophy training application built
with React Native and Expo. It combines structured multi-week training
programs with personal performance targets, adaptive coaching, recovery
guidance, workout history, and progress analytics.

The application is designed to help users progress through bodyweight
hypertrophy training while keeping exercise quality, recovery, and
individual performance history central to training decisions.

**Developer & Author:** João Emanuel Monica Rolo\
**Current application version:** 1.0.0

------------------------------------------------------------------------

## Overview

PBH is more than a static workout plan. The application builds workouts
from the user's current program position and uses recorded training
history and workout feedback to provide individualized guidance.

A central concept is **Match or Beat (MB)**. During the initial baseline
period, PBH learns the user's current exercise ability. Valid historical
performance can then be used to establish future targets that the user
aims to match or improve while maintaining good form.

The application also contains dedicated systems for adaptive rest,
adaptive training volume, recovery-day guidance, pain interception,
deload and verification workouts, program readiness, graduation,
interrupted-workout recovery, and progress analytics.

> PBH provides general fitness and training guidance. It does not
> diagnose or treat injuries or medical conditions.

------------------------------------------------------------------------

## Core Features

### Structured training programs

PBH currently provides three progressive training pathways:

  --------------------------------------------------------------------------
  Program                     Duration         Workout Days Purpose
  --------------- -------------------- -------------------- ----------------
  Level 1 ---                  6 weeks                    4 Establish
  Foundation                                                foundational
                                                            bodyweight
                                                            hypertrophy
                                                            capacity

  Level 2 ---                  8 weeks                    4 Increase
  Growth                                                    training demand
                                                            and hypertrophy
                                                            progression

  Level 3 --- Max              8 weeks                    5 Highest-volume
  Hypertrophy                                               pathway and
                                                            ongoing advanced
                                                            training
  --------------------------------------------------------------------------

Program sessions are assembled from global exercise definitions and
program-specific prescriptions including sets, exercise configuration,
side mode, optional exercises, rest periods, and runtime targets.

### Week 1 baseline

Week 1 establishes the user's initial performance baseline.

The Week 1 coach explains that users should:

-   perform exercises with good, controlled form;
-   work close to their current maximum for repetitions or holds;
-   avoid sacrificing technique simply to record a higher result; and
-   use the exercise guides when they need help with exercise execution.

The resulting valid performance history provides the foundation for
future Match or Beat targets.

### Match or Beat targets

Match or Beat targets provide personal performance goals based on usable
training history.

PBH deliberately filters unsuitable evidence. Deload performances,
skipped sets, explicitly excluded recovered data, low-rated workouts,
and workouts associated with relevant joint discomfort, form breakdown,
or low-energy feedback are prevented from inappropriately lowering
future MB baselines.

When suitable historical evidence is not yet available, PBH uses
exercise configuration as initial guidance rather than treating fallback
values as historical progression evidence.

### Exercise execution

The application supports several exercise types:

-   repetitions;
-   timed holds;
-   tempo repetitions;
-   time-based exercises; and
-   alternating left/right exercises.

Numeric exercise values cannot be reduced below zero. Repetition
exercises can prepopulate from an MB target when available, otherwise
from the configured repetition range. Tempo exercises retain the counted
repetition result while allowing adjustment through the same
stepper-style interaction used elsewhere in the workout UI.

### Workout feedback

Completed workouts collect a difficulty rating and contextual feedback.
This information is interpreted by the coaching engines and helps PBH
distinguish useful progression evidence from sessions affected by
recovery or performance issues.

Workout completion considers dynamic warm-up, the main workout, and
static stretching, with the main workout carrying the majority of the
completion weighting.

### Adaptive Rest

Adaptive Rest can recommend recovery periods according to workout
performance.

Two modes are supported:

-   **Standard** --- uses configured performance drop-off rules.
-   **Personalized** --- uses comparable historical workouts to
    establish the user's normal set-to-set performance behaviour.

Personalized mode requires sufficient comparable history and falls back
to standard behaviour when that history is unavailable.

Visual rest timers between sets and exercises can be independently
enabled or disabled. Rest audio cues remain independent of those visual
timer settings, and active rest timers can be skipped by the user.

### Adaptive Volume

Adaptive Volume evaluates qualifying training evidence and can offer
additional work when appropriate.

Depending on the active configuration and training history, this may
include:

-   increasing sets for an existing exercise; or
-   activating an optional exercise.

Adaptive volume is offered through the coach rather than silently
modifying the user's prescription.

### Training schedule and recovery guidance

PBH uses advisory training cycles rather than imposing a rigid calendar
schedule.

The application supports recommended, balanced-recovery, and
extra-flexibility scheduling patterns. Normal recovery guidance can
recommend a rest day while still allowing an override where configured.

Pain-related recovery is handled separately and uses minimum
full-calendar-rest-day requirements.

### Pain interception and recovery

When joint discomfort is reported, PBH can ask follow-up questions about
whether discomfort remains and whether it affected good-form exercise
performance.

The resulting workflow may route the user into recovery rather than
ordinary progression.

This system is intended to provide conservative training guidance and
**must not be interpreted as medical diagnosis**.

### Deload and verification

PBH supports a recovery lifecycle that can include deload and
verification workouts.

A fatigue-related deload reduces training demand and is excluded from
future MB baseline generation. A subsequent verification workout uses
reduced targets to assess readiness to resume normal training. Healthy
verification performance may become valid future training history.

### Program readiness and graduation

Progression through PBH is based on training evidence rather than simply
reaching the last calendar week.

Week 1 acts as the baseline period and is not treated as a normal
comparison week. Readiness and graduation engines evaluate subsequent
evidence and determine whether the user should progress, repeat,
recover, verify, or remain within the current pathway.

The highest configured pathway can operate as an ongoing
maintenance/advanced training level.

### Interrupted-workout recovery

PBH can preserve an active workout snapshot so an interrupted session
can be resumed.

The recovery system is designed to distinguish trusted active workout
time from time spent with the application backgrounded or closed.
Recovered results can also be excluded from progression when data
integrity or user choice requires it.

### History and analytics

Completed workouts are retained in History with contextual information
such as program position, workout type, exercise results, and recovery
state.

The Progress area contains analytics for areas including:

-   exercise performance;
-   Match or Beat performance;
-   consistency;
-   recovery;
-   training load;
-   coaching state; and
-   program lifecycle/progression.

------------------------------------------------------------------------

## Application Navigation

The primary application areas are:

  -----------------------------------------------------------------------
  Area                                Purpose
  ----------------------------------- -----------------------------------
  **Home**                            Current program position, workout
                                      access, recovery state, progress,
                                      and contextual coaching

  **History**                         Completed workouts and workout
                                      details

  **Progress**                        Training and coaching analytics

  **Settings**                        User-configurable training,
                                      recovery, coaching, and help
                                      options
  -----------------------------------------------------------------------

Exercise guides and coaching screens are opened contextually from the
relevant workflow.

------------------------------------------------------------------------

## Help & About

The application includes a dedicated **Help & About** area rather than
using Help as a primary navigation destination.

It provides:

-   Getting Started guidance;
-   short FAQs;
-   explanations of PBH concepts such as MB, recovery, deload and
    verification;
-   exercise/training safety guidance;
-   application version information;
-   support contact information;
-   developer/author information; and
-   controls for resetting applicable onboarding/help guidance.

**Developer & Author:** João Emanuel Monica Rolo

------------------------------------------------------------------------

## Settings

PBH exposes user controls for the major adaptive systems.

### General

Includes general application guidance such as the Week 1 Baseline Coach.

### Training Schedule

Controls advisory recovery guidance, override behaviour, training-cycle
preference, and pain-recovery rest requirements.

### Adaptive Rest

Controls Adaptive Rest availability, Standard/Personalized mode, visual
rest timers, rest durations, maximum adaptive rest, and related effort
settings.

### Adaptive Volume

Controls whether Adaptive Volume is enabled, when it becomes eligible,
and the qualifying workout threshold.

### Workout Recovery

Controls interrupted-workout recovery behaviour, automatic recovery
offers, performance guidance, unusual-result warnings, and whether
eligible recovered data may contribute to progression.

------------------------------------------------------------------------

## Architecture

The project separates UI concerns from training and coaching logic.

Major functional domains include:

-   program and exercise configuration;
-   session/workout construction;
-   Match or Beat target generation;
-   workout feedback interpretation;
-   Adaptive Rest;
-   Adaptive Volume;
-   training schedule guidance;
-   pain interception;
-   deload and verification;
-   program readiness;
-   program graduation;
-   interrupted-workout recovery;
-   workout history;
-   analytics; and
-   persisted user settings.

Training decisions should remain in the relevant engine/configuration
layer rather than being duplicated inside presentation components.

------------------------------------------------------------------------

## Technology Stack

The current project is based on:

-   **React Native 0.81**
-   **React 19**
-   **Expo SDK 54**
-   **Expo Router 6**
-   **TypeScript 5.9**
-   **React Navigation 7**
-   **AsyncStorage**
-   Expo audio, image, haptics, file-system, print, sharing, SVG,
    screens, safe-area and related React Native/Expo packages.

The project includes development targets for Android, iOS, and web
through Expo. Feature parity should be verified on each intended release
platform.

------------------------------------------------------------------------

## Getting Started for Development

### Prerequisites

Install a supported Node.js environment and the platform tooling
required by Expo for the target platform.

### Install dependencies

``` bash
npm install
```

### Start the development server

``` bash
npx expo start
```

The Expo development interface can then be used to launch the
appropriate Android, iOS, or web target supported by the local
development environment.

> Use the scripts and dependency versions in `package.json` as the
> authoritative source for the current development commands and package
> versions.

------------------------------------------------------------------------

## Development Principles

When modifying PBH:

1.  Keep training/business decisions inside the appropriate engine or
    configuration layer.
2.  Do not treat configured fallback targets as historical progression
    evidence.
3.  Preserve the distinction between normal workouts, recovery, deload,
    and verification.
4.  Do not allow invalid/recovery-biased history to lower future Match
    or Beat baselines.
5.  Keep normal training recovery guidance advisory unless the active
    recovery workflow explicitly requires otherwise.
6.  Preserve exercise form and recovery guidance over target chasing.
7.  Maintain backward-compatible persisted state or provide appropriate
    migration/version handling.
8.  Add or update regression scenarios whenever an adaptive engine or
    progression rule changes.
9.  Keep Help content user-facing and concise; implementation details
    belong in technical documentation.
10. Update the FSD when a change materially alters application behaviour
    or business rules.

------------------------------------------------------------------------

## Testing

The project contains scenario-based tests and development runners
covering key workflows such as:

-   live program position;
-   Week 1/baseline behaviour;
-   Match or Beat behaviour;
-   workout feedback;
-   Adaptive Rest;
-   Adaptive Volume;
-   training schedules and recovery cycles;
-   immediate pain interception;
-   deload and verification;
-   workout recovery and snapshot integrity;
-   workout history/detail; and
-   program progression/graduation.

Before committing changes to a training engine, run the relevant
regression scenarios as well as a representative live workout flow.

High-value end-to-end checks include:

1.  normal workout;
2.  Week 1 baseline workout;
3.  alternating and non-alternating exercise inputs;
4.  Adaptive Rest Standard and Personalized modes;
5.  Adaptive Volume enabled and disabled;
6.  recommended recovery and override behaviour;
7.  pain-recovery workflow;
8.  deload followed by verification;
9.  interrupted-workout recovery;
10. repeat-week and graduation routing.

------------------------------------------------------------------------

## Functional Specification

The detailed product behaviour, business rules, functional requirements,
non-functional requirements, acceptance criteria, and requirement
traceability are maintained in the project **Functional Specification
Document (FSD)**.

The FSD should be treated as the functional reference for significant
application behaviour, while the current source code and tests remain
authoritative for the implementation of a specific build.

------------------------------------------------------------------------

## Support

For the current development/release phase:

**Email:** roloje777@gmail.com

A dedicated PBH support address is recommended before wider public
distribution so that application support can remain separate from
personal correspondence.

------------------------------------------------------------------------

## Health & Exercise Disclaimer

PBH is intended to provide general exercise and fitness guidance. It is
not a medical device and does not diagnose, treat, cure, or prevent
injury or disease.

Users should exercise within their abilities, maintain appropriate
technique, and seek qualified medical advice when they have health
concerns, persistent pain, injury, or uncertainty about whether exercise
is appropriate for them.

The application's pain and recovery workflows are training-management
features and are not medical assessments.

------------------------------------------------------------------------

## Author

**João Emanuel Monica Rolo**\
Developer & Author --- Progressive Bodyweight Hypertrophy Coach

------------------------------------------------------------------------

## Project Status

PBH is under active development. Features, program content, coaching
rules, configuration, and user-interface behaviour may evolve as
development and validation continue.

For material behavioural changes, update the associated tests and
Functional Specification Document alongside the implementation.
