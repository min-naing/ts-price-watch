import net from 'net';
import dns from 'dns';

// https://r1ch.net/blog/node-v20-aggregateeerror-etimedout-happy-eyeballs
dns.setDefaultResultOrder("ipv4first");
net.setDefaultAutoSelectFamilyAttemptTimeout(5000);
