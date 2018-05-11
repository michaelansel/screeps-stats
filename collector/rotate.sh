#!/bin/bash

[[ -f stats.log ]] || exit 0

target="stats.log-$(date +%s)"
mv stats.log "${target}"
gzip "${target}"