import co from 'co';
import Quarry from 'quarry-dns';
import Docker from 'dockerode';

co.wrap(function* init() {
    try {
        const docker = new Docker({socketPath: '/var/run/docker.sock'});
        const dnsServer = new Quarry({persistence: 'memory'});

        docker.getEvents((err, event) => {
            console.log(event);
        });

        dnsServer.listen(() => {
            console.log('Server started');
        });
    } catch (err) {
        console.error('There was an error initializing the application:', err);
        process.exit(1);
    }
})();
