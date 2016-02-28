import co from 'co';
import Quarry from 'quarry-dns';
import {createDockerClient} from './docker';

co.wrap(function* init() {
    try {
        const dockerClient = createDockerClient({socket: '/var/run/docker.sock'});
        const dnsServer = new Quarry({persistence: 'memory'});

        dnsServer.listen(co.wrap(function* () {
            console.log('Server started');

            dnsServer.persistence.create_forwarder('8.8.8.8', {timeout: 500, port: 53}, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }

                console.log('Forwarding to 8.8.8.8');
            });

            // TODO: Support container renames
            const eventStream = yield dockerClient.events({
                type: ['network', 'container'],
                event: ['connect', 'disconnect', 'rename']
            });

            const cache = {};
            const tld = process.env.DOCKER_DNS_TLD;

            const containers = yield dockerClient.containers();
            containers.forEach((container) => {
                const containerId = container.Id;
                const containerName = container.Names[0].substring(1);

                Object.keys(container.NetworkSettings.Networks).forEach((networkName) => {
                    const networkInfo = container.NetworkSettings.Networks[networkName];
                    const domain = `${containerName}.${networkName}.${tld}`;
                    const ip = networkInfo.IPAddress;

                    dnsServer.persistence.create_record(domain, {address: ip, type: 'A', ttl: 0}, (err) => {
                        if (err) {
                            console.error(err);
                            return;
                        }

                        if (!cache[containerId]) {
                            cache[containerId] = {};
                        }

                        cache[containerId][networkName] = {
                            domain,
                            ip
                        };

                        console.log('Added ' + domain);
                    });
                });
            });

            eventStream.on('data', co.wrap(function* (data) {
                const event = JSON.parse(data);

                if (event.Type === 'network') {
                    const containerId = event.Actor.Attributes.container;
                    const containerInfo = yield dockerClient.inspect(containerId);
                    const containerName = containerInfo.Name.substring(1);
                    const networkName = event.Actor.Attributes.name;
                    const networkInfo = containerInfo.NetworkSettings.Networks[networkName];
                    const domain = `${containerName}.${networkName}.${tld}`;

                    if (event.Action === 'connect') {
                        const ip = networkInfo.IPAddress;

                        dnsServer.persistence.create_record(domain, {address: ip, type: 'A', ttl: 0}, (err) => {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            if (!cache[containerId]) {
                                cache[containerId] = {};
                            }

                            cache[containerId][networkName] = {
                                domain,
                                ip
                            };

                            console.log('Added ' + domain);
                        });
                    } else if (event.Action === 'disconnect') {
                        dnsServer.persistence.delete_record(domain, (err) => {
                            if (err) {
                                console.error(err);
                                return;
                            }

                            cache[containerId][networkName] = undefined;

                            console.log('Removed ' + domain);
                        });
                    }
                } else if (event.Type === 'container') {
                    if (event.Action === 'rename') {
                        const containerName = event.Actor.Attributes.name;
                        const containerInfo = yield dockerClient.inspect(containerName);
                        const containerId = containerInfo.Id;

                        Object.keys(cache[containerId]).forEach((networkName) => {
                            const {domain: oldDomain, ip} = cache[containerId][networkName];
                            const domain = `${containerName}.${networkName}.${tld}`;
                            console.log(oldDomain);
                            console.log(domain);

                            dnsServer.persistence.delete_record(oldDomain, (err) => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }

                                dnsServer.persistence.create_record(domain, {address: ip, type: 'A', ttl: 0}, (err) => {
                                    if (err) {
                                        console.error(err);
                                        return;
                                    }

                                    cache[containerId][networkName].domain = domain;

                                    console.log('Renamed ' + oldDomain + ' to ' + domain);
                                });
                            });
                        });
                    }
                }
            }));
        }));
    } catch (err) {
        console.log(err);
        console.error('There was an error initializing the application:', err);
        process.exit(1);
    }
})();
