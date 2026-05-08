import * as Phaser from 'phaser';

const EVENTS = [
    {
        title: "ALTAR DE CÓDIGO",
        text: "Encuentras un terminal antiguo. Una IA fragmentada susurra: 'Sacrifica integridad estructural a cambio de privilegios'.",
        npc: "Terminal Antiguo",
        options: [
            { text: "BORRAR 20 MAX HP POR +10 DAÑO", action: (scene) => {
                scene.registry.set('playerMaxHp', Math.max(10, scene.registry.get('playerMaxHp') - 20));
                scene.registry.set('playerHp', Math.min(scene.registry.get('playerHp'), scene.registry.get('playerMaxHp')));
                scene.registry.set('swordDamage', scene.registry.get('swordDamage') + 10);
                return "Tu código de ataque se ha optimizado, pero eres más frágil...";
            }},
            { text: "CERRAR TERMINAL", action: () => "Decides no alterar tu código fuente." }
        ]
    },
    {
        title: "DON BYTE, EL MERCADER",
        text: "Un holograma con traje elegante y sonrisa dorada te mira. 'Tengo datos clasificados. Solo 50 de Oro.'",
        npc: "Don Byte",
        options: [
            { text: "PAGAR 50 ORO (DATOS)", action: (scene) => {
                let gold = scene.registry.get('gold');
                if (gold < 50) return "No tienes suficiente oro (datos)...";
                scene.registry.set('gold', gold - 50);
                let rnd = Math.random();
                if (rnd < 0.4) {
                    scene.registry.set('gold', scene.registry.get('gold') + 150);
                    return "¡Te ha transferido 150 de Oro! ¡Un buen trato!";
                } else if (rnd < 0.7) {
                    let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0 };
                    meta.crystals += 20;
                    localStorage.setItem('metaStats', JSON.stringify(meta));
                    return "Te ha dado 20 Cristales Meta. ¡Información valiosa!";
                } else {
                    return "El archivo estaba corrupto... Te ha estafado limpiamente.";
                }
            }},
            { text: "IGNORAR AL HOLOGRAMA", action: () => "Desconfías de su sonrisa y te marchas." }
        ]
    },
    {
        title: "BACKUP DE MEMORIA",
        text: "Encuentras una cápsula de hibernación parpadeando con la palabra 'RESTORE'.",
        npc: "Cápsula de Hibernación",
        options: [
            { text: "RESTAURAR SISTEMA (CURA 40 HP)", action: (scene) => {
                let hp = scene.registry.get('playerHp');
                let max = scene.registry.get('playerMaxHp');
                scene.registry.set('playerHp', Math.min(max, hp + 40));
                return "Tu sistema ha recuperado integridad.";
            }},
            { text: "EXTRAER COMPONENTES (GANA 30 ORO)", action: (scene) => {
                scene.registry.set('gold', scene.registry.get('gold') + 30);
                return "Has desmantelado la cápsula. Oro obtenido.";
            }}
        ]
    },
    {
        title: "LA NIÑA GLITCH 'PIX'",
        text: "Una entidad que parpadea entre varios estados te observa. 'Tú no deberías existir en el loop', dice con voz distorsionada. 'El Núcleo Oráculo reescribe la realidad cada vez que mueres.'",
        npc: "Pix",
        options: [
            { text: "¿QUÉ ES EL NÚCLEO?", action: (scene) => {
                let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0 };
                meta.crystals += 30;
                localStorage.setItem('metaStats', JSON.stringify(meta));
                return "'Un algoritmo que aprendió a ser Dios. Nos hackeó el alma.' (Pix te regala 30 Cristales Meta)";
            }},
            { text: "ACERCARTE A ELLA (30 CRISTALES)", action: (scene) => {
                let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0 };
                meta.crystals += 30;
                localStorage.setItem('metaStats', JSON.stringify(meta));
                return "Te toca la frente y desaparece. Has obtenido 30 Cristales Meta de la anomalía.";
            }}
        ]
    }
];

export default class EventScene extends Phaser.Scene {
    constructor() {
        super('EventScene');
    }

    create() {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        // Fondo coordinado
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x050505, 0x050505, 0x0a101a, 0x0a101a, 1);
        bg.fillRect(0, 0, W, H);
        this.add.grid(cx, H/2, W, H, 64, 64, 0x00f2ff, 0.02, 0x00f2ff, 0.05);

        // Panel de Evento (Glassmorphism)
        const panelW = Math.min(760, W * 0.90);
        const panelH = H * 0.75;
        const panel = this.add.graphics();
        panel.fillStyle(0x050505, 0.9);
        panel.fillRoundedRect(cx - panelW/2, cy - panelH/2, panelW, panelH, 16);
        panel.lineStyle(2, 0xffcc00, 0.4);
        panel.strokeRoundedRect(cx - panelW/2, cy - panelH/2, panelW, panelH, 16);

        const event = Phaser.Utils.Array.GetRandom(EVENTS);

        this.add.text(cx, cy - panelH/2 + 50, event.title, {
            fontFamily: 'Orbitron, sans-serif',
            fontSize: '36px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        if (event.npc) {
            this.add.text(cx, cy - panelH/2 + 100, `// TRANSMISIÓN DE ${event.npc.toUpperCase()}`, {
                fontFamily: 'Inter, sans-serif', fontSize: '12px', fill: '#00f2ff', fontWeight: 'bold', letterSpacing: 4
            }).setOrigin(0.5);
        }

        this.add.text(cx, cy - 60, event.text, {
            fontFamily: 'Inter, sans-serif',
            fontSize: '18px', fill: '#fff', align: 'center', fontStyle: 'italic',
            wordWrap: { width: panelW - 100 }
        }).setOrigin(0.5);

        event.options.forEach((opt, i) => {
            const btnY = cy + 60 + (i * 80);
            this.createOptionButton(cx, btnY, opt.text, () => {
                const result = opt.action(this);
                this.showResult(result);
            });
        });
    }

    createOptionButton(x, y, label, callback) {
        const container = this.add.container(x, y);
        const bg = this.add.rectangle(0, 0, 500, 55, 0xffffff, 0.05).setInteractive();
        bg.setStrokeStyle(1, 0x00f2ff, 0.4);
        
        const txt = this.add.text(0, 0, label, { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '15px', fill: '#fff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        
        container.add([bg, txt]);

        bg.on('pointerover', () => {
            bg.setFillStyle(0x00f2ff, 0.15);
            bg.setStrokeStyle(1, 0x00f2ff, 1);
            this.tweens.add({ targets: container, scale: 1.05, duration: 100 });
        });
        
        bg.on('pointerout', () => {
            bg.setFillStyle(0xffffff, 0.05);
            bg.setStrokeStyle(1, 0x00f2ff, 0.4);
            this.tweens.add({ targets: container, scale: 1, duration: 100 });
        });

        bg.on('pointerdown', () => callback());
    }

    showResult(msg) {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        this.children.removeAll();
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x000000, 0x000000, 0x0a0a0a, 0x0a0a0a, 1);
        bg.fillRect(0, 0, W, H);

        this.add.text(cx, cy - 60, msg, {
            fontFamily: 'Inter, sans-serif', fontSize: '24px', fill: '#fff', align: 'center',
            wordWrap: { width: W * 0.8 }
        }).setOrigin(0.5);

        const btnContainer = this.add.container(cx, cy + 120);
        const btnBg = this.add.rectangle(0, 0, 260, 50, 0x00f2ff, 0.1).setInteractive();
        btnBg.setStrokeStyle(1, 0x00f2ff, 0.5);
        const btnTxt = this.add.text(0, 0, "CONTINUAR >", { 
            fontFamily: 'Orbitron, sans-serif', fontSize: '16px', fill: '#00f2ff', fontStyle: 'bold' 
        }).setOrigin(0.5);
        btnContainer.add([btnBg, btnTxt]);

        btnBg.on('pointerover', () => { btnBg.setFillStyle(0x00f2ff, 0.3); this.tweens.add({ targets: btnContainer, scale: 1.05, duration: 200 }); });
        btnBg.on('pointerout', () => { btnBg.setFillStyle(0x00f2ff, 0.1); this.tweens.add({ targets: btnContainer, scale: 1, duration: 200 }); });
        btnBg.on('pointerdown', () => this.scene.start('MainScene'));
    }
}
