### node-docker-dns

docker network create --subnet 172.25.0.0/16 --ip-range 172.25.128.0/17 local

docker run --name docker-dns -e DOCKER_DNS_TLD=local -v /var/run/docker.sock:/var/run/docker.sock -itd --net local --ip 172.25.0.1 --restart always jakemccloskey/docker-dns
