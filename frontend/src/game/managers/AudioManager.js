export class AudioManager {
    constructor(scene) {
        this.scene = scene;
    }

    async handleSceneMusic() {
        const { scene } = this;

        if (!scene.cache || !scene.cache.audio) return;

        if (scene.sound.context.state === 'suspended') {
            await scene.sound.context.resume();
        }

        if (!scene.cache.audio.exists('game_track1')) {
            console.warn("⚠️ Audio no cargado en caché, omitiendo música.");
            return;
        }

        const isCritical = scene.isBossLevel || scene.nodeType === 'elite';
        const currentMusicKey = scene.registry.get('currentMusicKey');

        if (isCritical) {
            if (currentMusicKey !== 'game_boss') {
                this._switchTrack('game_boss');
            }
            return;
        }

        if (currentMusicKey === 'game_track1' || currentMusicKey === 'game_track2') {
            const currentMusic = scene.sound.get(currentMusicKey);
            if (!currentMusic || !currentMusic.isPlaying) {
                const nextTrack = currentMusicKey === 'game_track1' ? 'game_track2' : 'game_track1';
                this._switchTrack(nextTrack);
            }
            return;
        }

        const randomTrack = Math.random() > 0.5 ? 'game_track1' : 'game_track2';
        this._switchTrack(randomTrack);
    }

    _switchTrack(targetTrack) {
        const { scene } = this;
        const targetVolume = window.isMuted ? 0 : 0.5;
        const currentMusicKey = scene.registry.get('currentMusicKey');

        if (currentMusicKey === targetTrack) {
            const current = scene.sound.get(targetTrack);
            if (current && current.volume !== targetVolume) {
                scene.tweens.add({ targets: current, volume: targetVolume, duration: 500 });
            }
            return;
        }

        const musicKeys = ['game_track1', 'game_track2', 'game_boss'];
        musicKeys.forEach(key => {
            const instances = scene.sound.getAll(key);
            instances.forEach(ins => {
                if (ins.isPlaying) {
                    scene.tweens.add({
                        targets: ins,
                        volume: 0,
                        duration: 800,
                        onComplete: () => ins.stop()
                    });
                }
            });
        });

        const music = scene.sound.add(targetTrack, { loop: false, volume: 0 });
        music.play();

        music.once('complete', () => {
            if (scene.registry.get('currentMusicKey') === targetTrack) {
                this.handleSceneMusic();
            }
        });
        music.on('stop', () => {
            if (scene.registry.get('currentMusicKey') === targetTrack) {
                this.handleSceneMusic();
            }
        });

        scene.tweens.add({
            targets: music,
            volume: targetVolume,
            duration: 1000
        });

        scene.registry.set('currentMusicKey', targetTrack);
    }

    playSFX(key, volume = 0.6) {
        if (window.isMuted) return;
        try {
            this.scene.sound.play(key, { volume });
        } catch (e) {
            console.warn(`Error al reproducir SFX ${key}:`, e);
        }
    }
}
