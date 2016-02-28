import co from 'co';
import {createDockerEventsManager} from './docker_events_manager';

const onConnect = co.wrap(function* onConnect(event, dnsServer, dockerClient, tld, cache) {
    const containerId = event.Actor.Attributes.container;
    const networkName = event.Actor.Attributes.name;
    const containerInfo = yield dockerClient.inspect(containerId);
    const containerName = containerInfo.Name.substring(1);
    const networkInfo = containerInfo.NetworkSettings.Networks[networkName];
    const domain = `${containerName}.${networkName}.${tld}`;
    const ip = networkInfo.IPAddress;

    yield dnsServer.addRecord(ip, domain);
    if (!cache.has(containerId)) {
        cache.set(containerId, new Map());
    }

    cache.get(containerId).set(networkName, {domain, ip});

    console.log('Added ' + domain);
});

const onDisconnect = co.wrap(function* onDisconnect(event, dnsServer, dockerClient, tld, cache) {
    const containerId = event.Actor.Attributes.container;
    const networkName = event.Actor.Attributes.name;

    console.log(networkName);

    if (!cache.has(containerId) || !cache.get(containerId).has(networkName)) {
        return;
    }

    const containerInfo = yield dockerClient.inspect(containerId);
    const containerName = containerInfo.Name.substring(1);
    const domain = `${containerName}.${networkName}.${tld}`;
    const ip = cache.get(containerId).get(networkName).ip;

    console.log('test 1', ip);
    yield dnsServer.removeRecord(ip, domain);

    cache.get(containerId).delete(networkName);
    if (cache.get(containerId).size === 0) {
        cache.delete(containerId);
    }

    console.log('Removed ' + domain);
});

const onRename = co.wrap(function* onRename(event, dnsServer, dockerClient, tld, cache) {
    const containerName = event.Actor.Attributes.name;
    const containerInfo = yield dockerClient.inspect(containerName);
    const containerId = containerInfo.Id;

    // TODO: Do this in a batch
    for (const [networkName, {domain: oldDomain, ip}] of cache.get(containerId).entries()) {
        const domain = `${containerName}.${networkName}.${tld}`;
        yield dnsServer.removeRecord(ip, oldDomain);
        yield dnsServer.addRecord(ip, domain);
        cache.get(containerId).get(networkName).domain = domain;

        console.log('Renamed ' + oldDomain + ' to ' + domain);
    }
});

class DockerHostsUpdater {
    constructor({dnsServer, dockerClient, tld, cache}) {
        this._dockerEventsManager = createDockerEventsManager({
            dockerClient,
            callbacks: {
                network: {
                    connect: (event) => onConnect(event, dnsServer, dockerClient, tld, cache),
                    disconnect: (event) => onDisconnect(event, dnsServer, dockerClient, tld, cache)
                },
                container: {
                    rename: (event) => onRename(event, dnsServer, dockerClient, tld, cache)
                }
            }
        });
    }

    start() {
        return this._dockerEventsManager.listen();
    }
}

export const createDockerHostsUpdater = co.wrap(function* createDockerHostsUpdater({dnsServer, dockerClient, tld}) {
    const cache = new Map();
    const containers = yield dockerClient.containers();
    // TODO: Do this in a batch
    for (const container of containers) {
        const containerId = container.Id;
        const containerName = container.Names[0].substring(1);

        for (const networkName of Object.keys(container.NetworkSettings.Networks)) {
            const networkInfo = container.NetworkSettings.Networks[networkName];
            const domain = `${containerName}.${networkName}.${tld}`;
            const ip = networkInfo.IPAddress;

            yield dnsServer.addRecord(ip, domain);
            if (!cache.has(containerId)) {
                cache.set(containerId, new Map());
            }

            cache.get(containerId).set(networkName, {domain, ip});

            console.log('Added ' + domain);
        }
    }

    return new DockerHostsUpdater({dnsServer, dockerClient, tld, cache});
});
