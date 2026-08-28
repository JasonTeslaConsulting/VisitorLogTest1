REM Builds this portal's image and pushes it to Tesla Consulting's ACR.
REM Set IMAGE to this portal's own repository before first use — the build and
REM the push must name the SAME tag.
REM
REM For a build that needs no ACR access at all, see docker/Dockerfile.nginx.

SET IMAGE=tesladev.azurecr.io/[portal-name]
SET TAG=latest

az acr login --name tesladev || EXIT /B 1

docker build -f docker/Dockerfile -t %IMAGE%:%TAG% . || EXIT /B 1

docker push %IMAGE%:%TAG%
