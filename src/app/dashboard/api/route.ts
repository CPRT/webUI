const hosts = ['192.168.0.2', '192.168.0.3', '192.168.0.55']; // Add more hosts here as needed

const ping = require('ping');

// Ping configuration
const pingConfig = {
  timeout: 1, // timeout set to 1 second
};

// Function to ping multiple hosts and return RTT times in dictionary format
async function pingHosts(hosts: string[]): Promise<{ [key: string]: number }> {
  const results: { [key: string]: number } = {};
  
  const pingPromises = hosts.map(async (host) => {
    try {
      const res = await ping.promise.probe(host, pingConfig);
      if (res.alive) {
        results[host] = parseFloat(res.time as string);
      } else {
        results[host] = -1;
      }
    } catch (error) {
      results[host] = -1;
    }
  });
  
  await Promise.all(pingPromises);
  return results;
}

export async function GET(request: Request) {
  try {
    const pings = await pingHosts(hosts);
    return Response.json({pings});
  } catch (error: any) {
    console.error('Failed to ping hosts:', error);
    return Response.json(
      { error: 'Failed to ping hosts: ' + error.message },
      { status: 500 }
    );
  }
}

