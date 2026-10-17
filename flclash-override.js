// FlClash / Clash Party 通用覆写脚本：入口 main(config)
function main(config) {
  // ============ 0) pximg 专用出口（运行时探测，不硬编码）============
  // 背景：pximg.net 是 pixiv / fanbox 的图片域名。部分机场出口 IP 段被它的 CDN
  //       拉黑，症状是 TCP 能建连、上行发出去了但下行 0 字节 —— 页面骨架能开、
  //       图片全部超时（fanbox「打不开」的真相）。
  // 所以：不能挂在按通用 URL 测速的「自动选择」上；也不能硬编码节点名，
  //       订阅换名会让 proxy not found 导致整份配置加载失败。
  // 做法：先看当前订阅里到底有哪些节点，只有命中的才放进 url-test 组；
  //       一个都没命中就整段跳过，规则也不加，保持订阅原样。
  var PXIMG_CANDIDATES = [
    '🇹🇼台湾',
    '🇭🇰香港家宽专线',
    '🇭🇰香港HKBN',
    '🇭🇰香港HKBN2'
  ];
  var available = {};
  (config.proxies || []).forEach(function (p) { if (p && p.name) available[p.name] = true; });
  (config['proxy-groups'] || []).forEach(function (g) { if (g && g.name) available[g.name] = true; });
  var pximgMembers = PXIMG_CANDIDATES.filter(function (n) { return available[n]; });

  if (pximgMembers.length > 0) {
    // url-test 的探测 URL 直指 pximg 自己，组内只放能通的出口，
    // 于是它永远只在可用节点里挑最快的，不会漂到被拉黑的段。
    config['proxy-groups'] = [{
      name: 'pximg',
      type: 'url-test',
      url: 'https://i.pximg.net/',
      interval: 300,
      tolerance: 100,
      proxies: pximgMembers
    }].concat(config['proxy-groups'] || []);
  }

  // ============ 1) 规则：整块插到订阅规则之前（顺序即优先级）============
  // 注：Party 的 `+rules` 语义就是"插到订阅 rules 之前"，
  //     所以"兜底规则务必放最后"= 放在下面这个数组的最后。
  var headRules = [
    // ---- 直连 ----
    'DOMAIN-SUFFIX,2go2.top,DIRECT',
    'DOMAIN-SUFFIX,adblockplus.dev,DIRECT',
    'DOMAIN-SUFFIX,asus.com,DIRECT',
    'DOMAIN-SUFFIX,diplnk.com,DIRECT',
    'DOMAIN-SUFFIX,wdpsmc.cn,DIRECT',
    'DOMAIN-SUFFIX,wenku8.net,DIRECT',
    'DOMAIN-SUFFIX,wenku8.com,DIRECT',
    // 注：PROCESS-NAME 在 Android 上永远匹配不到 —— 手机端进程是包名，
    //     不是 QQ.exe 这种可执行文件名。留着无害，但别指望它生效。
    'PROCESS-NAME,QQ.exe,DIRECT',
    'PROCESS-NAME,TeamSpeak.exe,DIRECT'
  ];

  // pixiv / fanbox 图片域：走上面的 pximg 组（仅在组真的建起来时才加）
  if (pximgMembers.length > 0) {
    headRules.push('DOMAIN-SUFFIX,pximg.net,pximg');
  }

  var tailRules = [
    // ---- 屏蔽 ----
    'DOMAIN-SUFFIX,adobe.com,REJECT',
    'DOMAIN-SUFFIX,adobe.io,REJECT',
    'DOMAIN-SUFFIX,adobelogin.com,REJECT',
    'DOMAIN-SUFFIX,adobegenuine.com,REJECT',
    'DOMAIN-SUFFIX,tly.bet,REJECT',
    'PROCESS-NAME,Photoshop.exe,REJECT',
    // ---- 兜底（务必留在本块最后）----
    'IP-CIDR6,240e::/16,DIRECT',
    'IP-CIDR6,2408::/16,DIRECT',
    'IP-CIDR6,2409::/16,DIRECT'
  ];

  config.rules = headRules.concat(tailRules).concat(config.rules || []);

  // ============ 2) 内核项（别让客户端默认值顶掉）============
  config.ipv6 = false;
  config['tcp-concurrent'] = true;
  config['find-process-mode'] = 'off';

  // ============ 3) DNS ============
  var dns = config.dns || {};

  // 3.1 明确 fake-ip：域名交给代理端解析，本地 DNS 不再决定"连到哪个 IP"。
  //     这是后面能放心干掉 fallback 的前提 —— 本地解析结果只用于分流判定。
  dns['enhanced-mode'] = 'fake-ip';

  // 3.2 只用加密上游。删掉明文 223.5.5.5：UDP 53 明文对境外域名是污染入口。
  dns.nameserver = [
    'https://doh.pub/dns-query',
    'https://dns.alidns.com/dns-query',
    'tls://dot.pub:853'
  ];

  // 3.3 default-nameserver 必须是纯 IP（用来解析上面那几个 DoH/DoT 自己的域名），
  //     这一层的明文是协议限制，躲不掉，只能限定用途。
  dns['default-nameserver'] = ['223.5.5.5', '119.29.29.29'];

  // 3.4 干掉 fallback 及 fallback-filter。
  //     只要配了 fallback，mihomo 就默认启用 fallback-filter（geoip-code=CN），
  //     把一切非中国 IP 的结果判为污染，转去问境外明文 DNS。
  //     在 fake-ip 下这毫无必要，纯属给每个境外域名多加一次往返。
  delete dns.fallback;
  delete dns['fallback-filter'];

  // 3.5 节点域名单独指定解析源，避免被任何策略带偏导致节点连不上。
  dns['proxy-server-nameserver'] = [
    'https://doh.pub/dns-query',
    'https://dns.alidns.com/dns-query'
  ];

  dns.ipv6 = false;

  dns['nameserver-policy'] = {
    '+.google.com': 'https://doh.pub/dns-query',
    '+.googleapis.com': 'https://doh.pub/dns-query',
    '+.googleapis.cn': 'https://doh.pub/dns-query',
    '+.googlevideo.com': 'https://doh.pub/dns-query',
    '+.gstatic.com': 'https://doh.pub/dns-query',
    '+.youtube.com': 'https://doh.pub/dns-query',
    '+.youtu.be': 'https://doh.pub/dns-query',
    '+.facebook.com': 'https://doh.pub/dns-query',
    '+.twitter.com': 'https://doh.pub/dns-query',
    '+.x.com': 'https://doh.pub/dns-query',
    '+.github.com': 'https://doh.pub/dns-query',
    '+.githubusercontent.com': 'https://doh.pub/dns-query',
    '+.openai.com': 'https://doh.pub/dns-query',
    '+.chatgpt.com': 'https://doh.pub/dns-query',
    '+.anthropic.com': 'https://doh.pub/dns-query'
  };

  // 追加语义：在订阅原有 fake-ip-filter 基础上加
  dns['fake-ip-filter'] = (dns['fake-ip-filter'] || []).concat(['wdpsmc.cn', '*.wdpsmc.cn']);

  config.dns = dns;

  return config;
}
