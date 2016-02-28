import co from 'co';
import {exec} from 'child_process';
import fs from 'fs';

const pidCommand = 'supervisorctl pid dnsmasq';
const hostsFile = '/etc/dnsmasq.d/hosts';

function generatePid() {
    return new Promise((resolve, reject) => {
        exec(pidCommand, (err, stdout) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(stdout);
        });
    });
}

function writeFile(file, data, options) {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, data, options, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

const dumpConfig = co.wrap(function* dumpConfig(records, test) {
    let config = '';

    for (const [ip, domains] of records.entries()) {
        config += ip;

        for (const domain of domains) {
            config += ` ${domain}`;
        }

        config += '\n';
    }

    console.log('test 4', test);
    yield writeFile(hostsFile, config);

    console.log('test 5', test);
    process.kill(yield generatePid(), 'SIGHUP');
    console.log('test 6', test);
});

const addRecord = co.wrap(function* addRecord(records, ip, domain) {
    if (!records.has(ip)) {
        records.set(ip, new Set());
    }

    records.get(ip).add(domain);
    yield dumpConfig(records);
});

const removeRecord = co.wrap(function* removeRecord(records, ip, domain) {
    if (!records.has(ip) || !records.get(ip).has(domain)) {
        return;
    }

    records.get(ip).delete(domain);

    if (records.get(ip).size === 0) {
        records.delete(ip);
    }

    console.log('test 3', ip);
    yield dumpConfig(records, ip);
});

class DnsServer {
    constructor() {
        this._records = new Map();
    }

    addRecord(ip, domain) {
        return addRecord(this._records, ip, domain);
    }

    removeRecord(ip, domain) {
        console.log('test 2', ip);
        return removeRecord(this._records, ip, domain);
    }
}

export function createDnsServer() {
    return new DnsServer();
}
