---
id: post-ultimate-android-progress
slug: ultimate-plus-progress-november-2026
title: 'Ultimate+ 2.26.0: live video between your devices, and a busy mid-November'
description: >-
  What's new in Ultimate+, my Android toolkit: the latest release is 2.26.0,
  with live video and sound over Octopus Mesh still waiting on a two-phone test.
status: published
visibility: public
kind: essay
publishedAt: '2026-11-16T17:30:00Z'
tags:
  - android
  - ultimate
projectIds:
  - prj-ultimate
provenance:
  origin: agent
---
Ultimate+ is the Android toolkit I have been building for my own phone. One app holds a growing set of tools: a video editor and shrinker, a map of what fills your storage, notification and clipboard history, rules you can write in a plain sentence, a terminal, and, in the Ultimate+ edition, an SSH client and server. There are no ads, no analytics and no accounts. The offline edition, Ultimate, has no internet permission at all. Both, plus a few single-purpose editions and a Galaxy Watch app, are built from the same Kotlin codebase. Android 10 or newer. The APKs live on the [Releases page](https://github.com/mosrvs2025/ultimate-android/releases/latest).

The current source version, according to the repository's README, is Ultimate+ 2.26.0 (build 148). That release went up late on 15 November 2026, Pacific time.

## What 2.26.0 adds

Octopus Mesh is how trusted devices can share work without a server of mine. In 2.25.0, also released that evening, a device can lend its back camera to the others in the mesh: you switch that on on the device itself, a notification stays up the whole time, and the other devices see still pictures.

2.26.0 turns "Watch camera" into a live call, with sound, using WebRTC. If the live call cannot connect, or the other device is still on the older version, you get the still pictures and a notice that says why. The changelog is specific about the rules, which matter more now that video and sound are involved: the camera and microphone are shared only after you switch that on, on that device's own screen; a notification stays up, says who is watching and has Stop on it; only devices paired with your mesh code can connect; the video and sound are encrypted; and the microphone is used only if that device has allowed it. There is no hidden mode.

A switch, "Live video across different networks", is on by default. It asks Google's public STUN servers for each device's outside address so the call can connect across networks. Those servers see the address and nothing else, never the picture or sound. Turn it off and live video works only on one network. Some networks block direct connections, and there is no relay server built in, so those fall back to still pictures. The app is about 20 MB bigger because it now carries Google's WebRTC library (arm64 only).

## What I have not verified yet

The 2.26.0 notes are honest about the next step: the live video and sound themselves have not yet been tried with two real devices — how smooth they are, delay, battery and heat, and connecting across networks. The work was covered with unit tests and release lint. Expect rough edges.

This site has not independently built and run the app either. The [project page](/projects/ultimate) is written from the repository's README and docs, and the screenshots there are the app's own screens, rendered on a simulated phone with sample data.

## The rest of mid-November

The days before 2.26.0 were busy. 2.14.0 lets you use Ultimate as your home screen, with a letter rail for your apps. 2.13.0 through 2.23.0 built out Movement: watch and phone sync for walks, a map with streets and a 3D view, more honest distance uncertainty, and a "Walk with friends" dashboard you can open from another device on the same Wi-Fi. 2.18.0 added joining a screen by QR, and using the phone as a Bluetooth keyboard and mouse.

Signed APKs for every edition are on the [2.26.0 release](https://github.com/mosrvs2025/ultimate-android/releases/tag/v2.26.0). If you try the live camera on two real phones, I would like to hear what you see. You can write to me on the [connect page](/connect).
