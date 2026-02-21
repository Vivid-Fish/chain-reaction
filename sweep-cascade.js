#!/usr/bin/env node
'use strict';

// Quick focused sweep for cascade_hold variants
// Reuses experiment.js engine via fork approach

const { execSync } = require('child_process');

const variants = [
    { name: 'hold_200ms',       args: '{"cascade":true,"EXPLOSION_RADIUS_PCT":0.10,"cascadeRadiusGrowth":0.08,"cascadeDurationGrowth":200,"cascadePullAtDepth":99}' },
    { name: 'hold_250ms',       args: '{"cascade":true,"EXPLOSION_RADIUS_PCT":0.10,"cascadeRadiusGrowth":0.06,"cascadeDurationGrowth":250,"cascadePullAtDepth":99}' },
    { name: 'hold_200+fast',    args: '{"cascade":true,"EXPLOSION_RADIUS_PCT":0.10,"cascadeRadiusGrowth":0.08,"cascadeDurationGrowth":200,"cascadePullAtDepth":99,"speedMin":0.7,"speedMax":1.4}' },
    { name: 'hold_150+fast',    args: '{"cascade":true,"EXPLOSION_RADIUS_PCT":0.10,"cascadeRadiusGrowth":0.08,"cascadeDurationGrowth":150,"cascadePullAtDepth":99,"speedMin":0.7,"speedMax":1.3}' },
    { name: 'hold_200+r12',    args: '{"cascade":true,"EXPLOSION_RADIUS_PCT":0.10,"cascadeRadiusGrowth":0.12,"cascadeDurationGrowth":200,"cascadePullAtDepth":99}' },
    { name: 'hold_150+r105',   args: '{"cascade":true,"EXPLOSION_RADIUS_PCT":0.105,"cascadeRadiusGrowth":0.10,"cascadeDurationGrowth":150,"cascadePullAtDepth":99}' },
];

console.log('Variant'.padEnd(20) + 'SCR'.padStart(7) + 'DHR'.padStart(7) + 'F3%'.padStart(7) + 'R50'.padStart(7) + 'Chaos'.padStart(7) + 'Score'.padStart(7) + 'AvgCh'.padStart(7) + 'God%'.padStart(7));
console.log('─'.repeat(69));

for (const v of variants) {
    const out = execSync(
        `node sim.js --runs 300 --round 5 --viewport 390x844 --config '${v.args}'`,
        { timeout: 60000 }
    ).toString();

    // Parse key metrics from output
    const scrMatch = out.match(/SCR:\s*([\d.]+)/);
    const dhrMatch = out.match(/DHR:\s*([\d.]+)/);
    const f3Match = out.match(/f3:\s*([\d.]+)%/);
    const r50Match = out.match(/r50:[\s\S]*?mean:\s*([\d.]+)px/);
    const chaosMatch = out.match(/retention200ms:\s*([\d.]+)%/);
    const avgMatch = out.match(/greedyAvg:\s*([\d.]+)/);
    const godMatch = out.match(/godChains:\s*(\d+)/);

    // Simpler: just extract the sweet spot checks
    const checks = out.match(/( OK | LOW|HIGH)/g) || [];
    const okCount = checks.filter(c => c.includes('OK')).length;

    const lines = out.split('\n');
    let scr='?', dhr='?', f3='?', r50='?', chaos='?', avg='?', god='?';
    for (const l of lines) {
        if (l.includes('Skill ceiling') && l.includes('×')) {
            const m = l.match(/([\d.]+)×/); if (m) scr = m[1];
        }
        if (l.includes('Drift hit ratio')) {
            const m = l.match(/\s+([\d.]+)\s+\(/); if (m) dhr = m[1];
        }
        if (l.includes('Opportunity (F3)')) {
            const m = l.match(/([\d.]+)%/); if (m) f3 = m[1];
        }
        if (l.includes('Input sensitivity')) {
            const m = l.match(/([\d.]+)px/); if (m) r50 = m[1];
        }
        if (l.includes('Chaos retention')) {
            const m = l.match(/([\d.]+)%/); if (m) chaos = m[1];
        }
        if (l.includes('Greedy avg chain')) {
            const m = l.match(/Greedy avg chain:\s*([\d.]+)/); if (m) avg = m[1];
        }
    }

    console.log(
        v.name.padEnd(20) +
        scr.toString().padStart(7) +
        dhr.toString().padStart(7) +
        (f3 + '%').padStart(7) +
        r50.toString().padStart(7) +
        (chaos + '%').padStart(7) +
        (okCount + '/5').padStart(7) +
        avg.toString().padStart(7) +
        (god + '%').padStart(7)
    );
}
