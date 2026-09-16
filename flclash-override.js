// FlClash / Clash Party 通用覆写脚本：入口 main(config)
function main(config) {
  // ============ 1) 规则：整块插到订阅规则之前（顺序即优先级）============
  // 注：Party 的 `+rules` 语义就是"插到订阅 rules 之前"，
  //     所以"兜底规则务必放最后"= 放在下面这个数组的最后。
  var myRules = [
    // ---- 直连 ----
    'DOMAIN-SUFFIX,2go2.top,DIRECT',
    'DOMAIN-SUFFIX,adblockplus.dev,DIRECT',
    'DOMAIN-SUFFIX,asus.com,DIRECT',
    'DOMAIN-SUFFIX,diplnk.com,DIRECT',
    'DOMAIN-SUFFIX,wdpsmc.cn,DIRECT',
    'DOMAIN-SUFFIX,wenku8.net,DIRECT',
    'DOMAIN-SUFFIX,wenku8.com,DIRECT',
    'PROCESS-NAME,QQ.exe,DIRECT',
    'PROCESS-NAME,TeamSpeak.exe,DIRECT',
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
  config.rules = myRules.concat(config.rules || []);

  // ============ 2) 内核项（别让客户端默认值顶掉）============
  config.ipv6 = false;
  config['tcp-concurrent'] = true;
  config['find-process-mode'] = 'off';

  // ============ 3) DNS：下列键整体替换 ============
  var dns = config.dns || {};
  dns.nameserver = [
    'https://doh.pub/dns-query',
    'https://dns.alidns.com/dns-query',
    'tls://dot.pub:853',
    '223.5.5.5'
  ];
  dns['default-nameserver'] = ['223.5.5.5', '119.29.29.29'];
  dns.fallback = ['tcp://208.67.222.222', 'tcp://8.26.56.2'];
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
