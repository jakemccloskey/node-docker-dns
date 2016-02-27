### node-docker-dns

docker network create --subnet 172.25.0.0/16 --ip-range 172.25.1.0/8 dns

docker run --name docker-dns -e DOCKER_DNS_TLD=local -v /var/run/docker.sock:/var/run/docker.sock -p 53/udp -itd --net dns --ip 172.25.0.2 --restart always jakemccloskey/docker-dns
