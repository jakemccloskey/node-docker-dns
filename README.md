### node-docker-dns

docker network create --subnet 172.25.0.0/16 --ip-range 172.25.128.0/17 local

docker run --name docker-dns -e DOCKER_DNS_TLD=local -v /var/run/docker.sock:/var/run/docker.sock -itd --net local --ip 172.25.0.1 --restart always --privileged jakemccloskey/docker-dns

Add dns entry to docker daemon, e.g. --dns 8.8.8.8
Can't have --userns-remap flag on since we need to mount the docker socket.
