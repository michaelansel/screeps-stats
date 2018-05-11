#!/bin/bash

timestamp=$(date +%s)
compactdir="compact-${timestamp}"
compactfile="stats.log-${timestamp}.gz"

mkdir -p "${compactdir}"

find . -maxdepth 1 -name 'stats.log-*' -exec mv '{}' "${compactdir}/" ';'

find "${compactdir}" -name 'stats.log-*' | sort | while read -r archive ; do
  echo "${archive}" >&2
  if [[ "${archive%%gz}" = "${archive}" ]] ; then
    cat "${archive}"
  else
    gunzip -dc "${archive}"
  fi
done | gzip > "${compactfile}"

du -sh "${compactdir}" "${compactfile}"

date
