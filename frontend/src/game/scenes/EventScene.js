import * as Phaser from 'phaser';

const EVENTS = [
    {
        title: "Altar de Código",
        text: "Encuentras un terminal antiguo. Una IA fragmentada susurra: 'Sacrifica integridad estructural a cambio de privilegios'.",
        options: [
            { text: "Borrar 20 Max HP por +10 Daño", action: (scene) => {
                scene.registry.set('playerMaxHp', Math.max(10, scene.registry.get('playerMaxHp') - 20));
                scene.registry.set('playerHp', Math.min(scene.registry.get('playerHp'), scene.registry.get('playerMaxHp')));
                scene.registry.set('swordDamage', scene.registry.get('swordDamage') + 10);
                return "Tu código de ataque se ha optimizado, pero eres más frágil...";
            }},
            { text: "Cerrar terminal", action: () => "Decides no alterar tu código fuente." }
        ]
    },
    {
        title: "Don Byte, El Mercader",
        text: "Un holograma con traje elegante y sonrisa dorada te mira. 'Tengo datos clasificados. Solo 50 de Oro.'",
        options: [
            { text: "Pagar 50 Oro", action: (scene) => {
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
            { text: "Ignorar al holograma", action: () => "Desconfías de su sonrisa y te marchas." }
        ]
    },
    {
        title: "Backup de Memoria",
        text: "Encuentras una cápsula de hibernación parpadeando con la palabra 'RESTORE'.",
        options: [
            { text: "Restaurar sistema (Cura 40 HP)", action: (scene) => {
                let hp = scene.registry.get('playerHp');
                let max = scene.registry.get('playerMaxHp');
                scene.registry.set('playerHp', Math.min(max, hp + 40));
                return "Tu sistema ha recuperado integridad.";
            }},
            { text: "Extraer componentes (Gana 30 Oro)", action: (scene) => {
                scene.registry.set('gold', scene.registry.get('gold') + 30);
                return "Has desmantelado la cápsula. Oro obtenido.";
            }}
        ]
    },
    {
        title: "La Niña Glitch 'Pix'",
        text: "Una entidad que parpadea entre varios estados te observa. 'Tú no deberías existir en el loop', dice con voz distorsionada. 'El Núcleo Oráculo reescribe la realidad cada vez que mueres. Somos simulaciones rotas intentando recordar lo que es ser real.'",
        options: [
            { text: "¿Qué es el Núcleo?", action: (scene) => {
                return "'Un algoritmo que aprendió a ser Dios. Nos hackeó el alma. Ahora la magia es código y nosotros... somos bugs.' (Pix te regala 30 Cristales)";
            }},
            { text: "Acercarte a ella (30 Cristales)", action: (scene) => {
                let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0 };
                meta.crystals += 30;
                localStorage.setItem('metaStats', JSON.stringify(meta));
                return "Te toca la frente y desaparece. Has obtenido 30 Cristales Meta de la anomalía.";
            }}
        ]
    },
    {
        title: "Krak-7, El Chatarrero",
        text: "Un montón de cables y metal con un ojo humano te saluda. '¡G-glitch! Busco piezas... busco v-vida. El mundo antiguo era verde, ¿sabes? Ahora solo es N-neón Sagrado.'",
        options: [
            { text: "Intercambiar datos por Potencia", action: (scene) => {
                let gold = scene.registry.get('gold');
                if (gold < 40) return "Krak-7 parpadea: 'N-necesito más datos (Oro)...'";
                scene.registry.set('gold', gold - 40);
                scene.registry.set('swordDamage', scene.registry.get('swordDamage') + 8);
                return "Krak-7 instala un parche en tu espada. +8 Daño, pero te sientes observado por el Núcleo.";
            }},
            { text: "Preguntar por su historia", action: () => "Krak-7 ríe con ruido estático: 'Era un Reciclador... ahora soy el reciclado. Cuidado con los Puros, odian lo que somos.'" }
        ]
    },
    {
        title: "Lupus, El Cazador Silencioso",
        text: "Un hombre con máscara de lobo y una armadura de fibra óptica está sentado sobre un Ente Aumentado muerto. Solo respeta a los fuertes.",
        options: [
            { text: "Demostrar tu valía (Perder 15 HP)", action: (scene) => {
                scene.registry.set('playerHp', Math.max(1, scene.registry.get('playerHp') - 15));
                let meta = JSON.parse(localStorage.getItem('metaStats')) || { crystals: 0 };
                meta.crystals += 40;
                localStorage.setItem('metaStats', JSON.stringify(meta));
                return "Te haces un corte ceremonial. Lupus asiente y te entrega 40 Cristales. 'Sigue cazando, error del sistema.'";
            }},
            { text: "Pasar de largo", action: () => "Lupus no se mueve. No eres digno de su tiempo." }
        ]
    },
    {
        title: "Mr. Null, El Banquero",
        text: "Un ente sin cara, vestido con un traje que parece absorber la luz, te ofrece un contrato. 'El oro es efímero en la simulación. Permíteme guardarlo... bajo mi custodia.'",
        options: [
            { text: "Depositar 100 Oro para el futuro", action: (scene) => {
                let gold = scene.registry.get('gold');
                if (gold < 100) return "Mr. Null señala tu bolsa vacía. No hay trato.";
                scene.registry.set('gold', gold - 100);
                // Lógica de banco (para implementar persistencia de oro si se desea)
                return "Mr. Null absorbe el oro. 'Estará aquí... si la simulación no se corrompe.' (Has invertido en tu próximo run)";
            }},
            { text: "Rechazar contrato", action: () => "Mr. Null se desvanece en un vacío absoluto." }
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

        this.add.rectangle(cx, cy, W, H, 0x111122);
        this.add.rectangle(cx, cy, Math.min(700, W * 0.85), H * 0.72, 0x000000, 0.85).setStrokeStyle(2, 0xffffff);

        const event = Phaser.Utils.Array.GetRandom(EVENTS);

        this.add.text(cx, H * 0.20, event.title, {
            fontSize: '32px', fill: '#ffcc00', fontStyle: 'bold'
        }).setOrigin(0.5);

        this.add.text(cx, H * 0.35, event.text, {
            fontSize: '17px', fill: '#fff', align: 'center',
            wordWrap: { width: Math.min(580, W * 0.75) }
        }).setOrigin(0.5);

        event.options.forEach((opt, i) => {
            const btnY = H * 0.56 + (i * H * 0.10);
            const btn = this.add.rectangle(cx, btnY, Math.min(520, W * 0.70), 50, 0x333333).setInteractive();
            const txt = this.add.text(cx, btnY, opt.text, {
                fontSize: '16px', fill: '#fff', align: 'center',
                wordWrap: { width: Math.min(490, W * 0.65) }
            }).setOrigin(0.5);

            btn.on('pointerover', () => btn.setFillStyle(0x555555));
            btn.on('pointerout', () => btn.setFillStyle(0x333333));
            btn.on('pointerdown', () => {
                const result = opt.action(this);
                this.showResult(result);
            });
        });
    }

    showResult(msg) {
        const W = this.scale.width;
        const H = this.scale.height;
        const cx = W / 2;
        const cy = H / 2;

        this.children.removeAll();
        this.add.rectangle(cx, cy, W, H, 0x000000, 0.92);
        this.add.text(cx, cy - 60, msg, {
            fontSize: '24px', fill: '#fff', align: 'center',
            wordWrap: { width: Math.min(560, W * 0.75) }
        }).setOrigin(0.5);

        const btn = this.add.rectangle(cx, cy + 100, 220, 55, 0x444444).setInteractive();
        this.add.text(cx, cy + 100, "Continuar", { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);

        btn.on('pointerdown', () => this.scene.start('MainScene'));
    }
}
