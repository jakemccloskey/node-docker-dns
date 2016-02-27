// import co from 'co';
import Docker from 'dockerode';

class DockerClient {
    constructor({socket}) {
        this._inner = new Docker({socketPath: socket})
    }

    events(filters) {
        return new Promise((resolve, reject) => {
            this._inner.getEvents({filters}, (err, stream) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(stream);
                }
            });
        });
    }

    inspect(id) {
        const container = this._inner.getContainer(id);

        return new Promise((resolve, reject) => {
            container.inspect((err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }

    containers() {
        return new Promise((resolve, reject) => {
            this._inner.listContainers((err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
    }
}

export function createDockerClient(options) {
    return new DockerClient(options);
}
