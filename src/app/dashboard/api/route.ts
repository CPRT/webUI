const USERNAME = 'ubnt';
const PASSWORD = 'samitherover';
const baseStationIP = '192.168.0.2';

const hosts = ['192.168.0.2', '172.19.228.1']; // Add more hosts here as needed

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

// Authenticates with the base station
async function authenticate() {
  const response = await fetch(`http://${baseStationIP}/api/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
    }),
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  const setCookie = response.headers.getSetCookie()[0]

  return {cookie: setCookie}
}

// Fetches status JSON from the base station
async function fetchStatus(cookie: string) {
  const response = await fetch(`http://${baseStationIP}/status.cgi`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Cookie': cookie
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch status, error code: ' + response.status);
  }
  return response.json();
}

export async function GET(request: Request) {
  // Initialize response data with defaults
  let uplinkCapacity = 0;
  let downlinkCapacity = 0;
  let uplinkThroughput = 0;
  let downlinkThroughput = 0;
  let baseStationError: string | null = null;

  // Try to fetch base station data, but don't fail if it's unavailable
  try {
    const authStatus = await authenticate();
    const status = await fetchStatus(authStatus.cookie);

    uplinkCapacity = status.wireless?.polling?.ucap ?? 0;
    downlinkCapacity = status.wireless?.polling?.dcap ?? 0;
    uplinkThroughput = status.wireless?.throughput?.tx ?? 0;
    downlinkThroughput = status.wireless?.throughput?.rx ?? 0;
  } catch (error: any) {
    baseStationError = error.message;
    console.warn('Failed to fetch base station data:', error.message);
  }

  // Always ping hosts, regardless of base station status
  try {
    const pings = await pingHosts(hosts);

    return Response.json({
      uplinkCapacity,
      downlinkCapacity,
      uplinkThroughput,
      downlinkThroughput,
      pings,
      baseStationError, // Include error info in response
    });
  } catch (error: any) {
    console.error('Failed to ping hosts:', error);
    return Response.json(
      { error: 'Failed to ping hosts: ' + error.message },
      { status: 500 }
    );
  }
}

