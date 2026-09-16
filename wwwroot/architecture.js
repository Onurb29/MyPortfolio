(() => {
  const map = document.getElementById('architecture-map');
  if (!map) return;
  const nodes = [...document.querySelectorAll('[data-node]')];
  const detail = document.getElementById('node-detail');
  const home = document.getElementById('detail-home');
  const paths = document.getElementById('edge-paths');
  const mobile = window.matchMedia('(max-width:860px)');
  const links = [['field','mqtt','planned'],['mqtt','logic','planned'],['logic','series','planned'],['logic','sql','planned'],['series','grafana','planned'],['portainer','engine','management'],['engine','grafana','GPU monitoring'],['engine','ai','hosting'],['series','ai','planned summaries']];
  const data = {
    field: ['Field nodes','Planned · Field equipment','ESP32 and LoRa nodes will collect greenhouse moisture and equipment signals. A LoRa-to-MQTT bridge is still to be defined; the arrow shows the intended logical route, not a direct LoRa connection to Mosquitto.'],
    mqtt: ['Mosquitto','Active · nas-01','The MQTT broker receives published messages and delivers them to subscribers. The proposed path feeds Node-RED; the end-to-end greenhouse integration has not been verified.'],
    logic: ['Node-RED','Active · nas-01 · Port 1880','Processes messages and routes data. The proposed design sends timestamped measurements to InfluxDB and uses MariaDB for structured context and records. These arrows are design intent, not confirmed running flows.'],
    series: ['InfluxDB','Building · nas-01 · InfluxDB 2','Time-series storage for timestamped measurements, trends and diagnostics. Node-RED ingestion and Grafana queries are proposed integrations; persistent storage is part of the setup.'],
    sql: ['MariaDB','Active · nas-01 · MariaDB 11.8','Relational storage for application records and reference data, managed through DBeaver on the trusted LAN. The connection from Node-RED is proposed and does not imply every sensor message belongs in this database.'],
    grafana: ['Grafana','GPU monitoring active · IoT dashboards planned','Grafana already monitors the GPU on AlloyEngine. Future dashboards will visualize collected IoT data. The InfluxDB-to-Grafana path remains planned; the diagram shows logical monitoring relationships without assuming a specific metrics collector or Grafana host.'],
    portainer: ['Portainer','Connected · NAS-01 · Management plane','Portainer runs on NAS-01 and manages all Docker containers on both NAS-01 and AlloyEngine. Local management covers the NAS services, including Mosquitto, Node-RED, InfluxDB and MariaDB. Remote management connects to the AlloyEngine Portainer Agent on port 9001. These management links are separate from the IoT measurement pipeline.'],
    engine: ['AlloyEngine','Ubuntu Server 24.04.4 LTS · RTX 3090 24 GB · 32 GB RAM','The GPU compute host runs Docker with NVIDIA Container Toolkit and Ollama. Portainer on NAS-01 manages its containers, and Grafana monitors GPU performance. NVIDIA driver 595.71.05 and Docker Engine 29.5.3 are documented in the setup notes.'],
    ai: ['Ollama','Active on AlloyEngine · IoT data summaries planned','Ollama provides local inference on the RTX 3090 and exposes its API on port 11434. The next goal is an AI layer that summarizes collected IoT data. The dashed path from InfluxDB represents this planned integration; retrieval and orchestration still need to be implemented. Existing coding workloads use Qwen models.']
  };
  let selected = null;
  const getNode = id => nodes.find(n => n.dataset.node === id);
  function placeDetail() {
    const parent = selected && mobile.matches ? getNode(selected).parentElement : home;
    if (detail.parentElement !== parent) parent.appendChild(detail);
  }
  function select(id) {
    selected = id;
    const connected = links.filter(pair => pair.includes(id));
    const related = new Set(connected.flat());
    nodes.forEach(n => {
      const key = n.dataset.node;
      n.setAttribute('aria-pressed', String(key === id));
      n.classList.toggle('related', related.has(key));
      n.classList.toggle('dim', !!id && key !== id && !related.has(key));
    });
    detail.replaceChildren();
    if (!id) {
      const p = document.createElement('p');
      p.textContent = 'Select a component to inspect its purpose and connections.';
      detail.append(p);
    } else {
      const [name,meta,description] = data[id];
      const heading = document.createElement('h3'); heading.textContent = name;
      const caption = document.createElement('p'); caption.className = 'detail-meta'; caption.textContent = meta;
      const body = document.createElement('p'); body.textContent = description;
      detail.append(heading,caption,body);
      if (connected.length) {
        const relatedLinks = document.createElement('div'); relatedLinks.className = 'detail-connections';
        for (const [from,to,status] of connected) {
          const other = from === id ? to : from;
          const button = document.createElement('button'); button.type = 'button';
          button.textContent = (from === id ? 'To ' : 'From ') + data[other][0] + ' · ' + (status === 'planned' ? 'planned' : status);
          button.addEventListener('click', () => { select(other); getNode(other).focus({preventScroll:true}); getNode(other).scrollIntoView({block:'nearest'}); });
          relatedLinks.append(button);
        }
        detail.append(relatedLinks);
      }
    }
    placeDetail();
    requestAnimationFrame(draw);
  }
  function draw() {
    if (!map.getBoundingClientRect().width) return;
    paths.replaceChildren();
    const origin = map.getBoundingClientRect();
    for (const [from,to,status] of links) {
      const a = getNode(from).getBoundingClientRect(), b = getNode(to).getBoundingClientRect();
      let x1,y1,x2,y2,d;
      if (mobile.matches || Math.abs(a.top-b.top) > Math.max(a.height,b.height)*1.5) {
        x1=a.left+a.width/2-origin.left; y1=a.bottom-origin.top;
        x2=b.left+b.width/2-origin.left; y2=b.top-origin.top-5;
        if (from === 'engine' && to === 'grafana' || from === 'series' && to === 'ai') {
          const gutter = origin.width - (from === 'engine' ? 3 : 12);
          x1=a.right-origin.left; y1=a.top+a.height/2-origin.top;
          x2=b.right-origin.left+5; y2=b.top+b.height/2-origin.top;
          d='M '+x1+' '+y1+' H '+gutter+' V '+y2+' H '+x2;
        } else {
          const mid=(y1+y2)/2;
          d='M '+x1+' '+y1+' C '+x1+' '+mid+' '+x2+' '+mid+' '+x2+' '+y2;
        }
      } else {
        x1=a.right-origin.left; y1=a.top+a.height/2-origin.top;
        x2=b.left-origin.left-5; y2=b.top+b.height/2-origin.top;
        const mid=(x1+x2)/2;
        d='M '+x1+' '+y1+' C '+mid+' '+y1+' '+mid+' '+y2+' '+x2+' '+y2;
      }
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      const highlighted = from===selected || to===selected;
      path.setAttribute('d',d);
      path.setAttribute('class','map-edge'+(status.startsWith('planned') ? '' : ' existing')+(selected ? highlighted ? ' highlight' : ' dim' : ''));
      path.setAttribute('marker-end',highlighted ? 'url(#arrow-focus)' : 'url(#arrow)');
      paths.append(path);
    }
  }
  nodes.forEach(node => node.addEventListener('click', () => select(node.dataset.node)));
  document.getElementById('reset-map').addEventListener('click', () => select(null));
  document.addEventListener('keydown', e => { if(e.key==='Escape' && selected) select(null); });
  const observer = new ResizeObserver(() => { placeDetail(); requestAnimationFrame(draw); });
  observer.observe(map);
  mobile.addEventListener('change', () => { placeDetail(); requestAnimationFrame(draw); });
  window.addEventListener('architecture-layout', () => requestAnimationFrame(draw));
  select(null);
})();

