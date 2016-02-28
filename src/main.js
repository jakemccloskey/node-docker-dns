import co from 'co';
import {createDockerClient} from './docker';
import {createDnsServer} from './dns';
import {createDockerHostsUpdater} from './docker_hosts_updater';

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise ', p, ' reason: ', reason);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.log(`Caught exception: ${err}`);
  process.exit(1);
});

co.wrap(function* init() {
    try {
        const tld = process.env.DOCKER_DNS_TLD;

        // TODO: Rename to something like HostsFileManager and pass callback on update.
        const dnsServer = createDnsServer();
        const dockerClient = createDockerClient({socket: '/var/run/docker.sock'});
        const dockerHostsUpdater = yield createDockerHostsUpdater({dnsServer, dockerClient, tld});

        yield dockerHostsUpdater.start();
    } catch (err) {
        console.error('There was an error initializing the application:', err);
        process.exit(1);
    }
})();
