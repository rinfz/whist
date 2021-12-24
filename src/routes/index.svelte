<script lang="ts">
    import produce from "immer";

    type PlayerData = {
        predictions: number[];
        met: boolean[];
        made: number[];
        totals: number[];
    };

    let playing = false;
    let complete = false;
    let players = [];
    let playersIn = "";
    let currentRound = 0;
    let gettingPredictions = true;
    let predictions: Record<string, PlayerData> = {};
    let tmpPredictions = {};
    let tmpMade = {};
    let counts = [];
    let trumps = [];

    function start() {
        playing = true;
        players = playersIn.trim().split('\n').map(p => p.trim());
        playersIn = "";

        counts = [...[10,9,8,7,6,5,4,3,2], ...Array.from({length: players.length}).fill(1), ...[2,3,4,5,6,7,8,9,10]];
        trumps = [...Array.from({length: counts.length}).fill("")];

        for (const player of players) {
            predictions[player] = { predictions: [], met: [], totals: [], made: [] };
            tmpPredictions[player] = 0;
            tmpMade[player] = 0;
        }
    }

    function donePredicting() {
        predictions = produce(predictions, (draft) => {
            for (const player of players) {
                if (!tmpPredictions[player]) {
                    draft[player].predictions.push(0);
                } else {
                    draft[player].predictions.push(tmpPredictions[player]);
                }
                tmpPredictions[player] = 0;
            }
        });
        gettingPredictions = false;
    }

    function doneScoring() {
        predictions = produce(predictions, (draft) => {
            for (const player of players) {
                const score = tmpMade[player] || 0;
                const met = score === draft[player].predictions[currentRound];
                const idx = draft[player].totals.length-1;
                let prev = 0;
                if (idx >= 0) {
                    prev = draft[player].totals[idx];
                }
                draft[player].met.push(met);
                if (met) {
                    draft[player].totals.push(prev + 10 + score);
                } else {
                    draft[player].totals.push(prev + score);
                }
                draft[player].made.push(score);
                tmpMade[player] = 0;
            }
        });

        currentRound += 1;
        tmpMade = {};
        gettingPredictions = true;

        if (currentRound >= counts.length) {
            playing = false;
            complete = true;
        }
    }

    function getWinner() {
        let winner = players[0];
        for (const player of players) {
            if (predictions[player].totals[predictions[player].totals.length-1] > predictions[winner].totals[predictions[winner].totals.length-1]) {
                winner = player;
            }
        }
        return winner;
    }

    $: invalidPredict = trumps[currentRound] === ""
        || Object.values(tmpPredictions).reduce((acc: number, c: number) => acc + c, 0) == counts[currentRound];
    $: invalidMake = Object.values(tmpMade).reduce((a:number,c:number) => a+c, 0) !== counts[currentRound];
</script>

{#if playing}
    {#if gettingPredictions}
        <div class="w-1/2 grid grid-cols-2 gap-2">
            {#each players as player}
                <span>{player} predicts:</span>
                <input bind:value={tmpPredictions[player]} type="number" class="border border-gray-300" />
            {/each}
        </div>
        <div class="flex space-x-2 items-center">
            <button on:click={donePredicting} class="btn disabled:opacity-50 mr-5" disabled={invalidPredict}>Done</button>
            <button on:click={() => trumps[currentRound] = "♠"} class="mt-1 px-2 py-1 bg-gray-300 rounded-md disabled:opacity-50"
                disabled={trumps[currentRound] === "♠"}>♠</button>
            <button on:click={() => trumps[currentRound] = "♣"} class="mt-1 px-2 py-1 bg-gray-300 rounded-md disabled:opacity-50"
                disabled={trumps[currentRound] === "♣"}>♣</button>
            <button on:click={() => trumps[currentRound] = "♥"} class="mt-1 px-2 py-1 bg-gray-300 rounded-md disabled:opacity-50"
                disabled={trumps[currentRound] === "♥"}>♥</button>
            <button on:click={() => trumps[currentRound] = "♦"} class="mt-1 px-2 py-1 bg-gray-300 rounded-md disabled:opacity-50"
                disabled={trumps[currentRound] === "♦"}>♦</button>
        </div>
    {:else}
        <div class="w-1/2 grid grid-cols-2 gap-2">
            {#each players as player}
                <span>{player} made:</span>
                <input bind:value={tmpMade[player]} type="number" class="border border-gray-300" />
            {/each}
        </div>
        <button on:click={doneScoring} class="btn disabled:opacity-50" disabled={invalidMake}>Done</button>
    {/if}

    <table class="table-fixed w-full">
        <thead>
            <tr>
                <th class="w-16">Round</th>
                <th class="w-16">Trump</th>
                <th class="w-24">Dealer</th>
                <th class="w-20">Predict First</th>
                {#each players as player}
                    <th>{player}</th>
                {/each}
            </tr>
        </thead>
        <tbody>
            {#each counts as count, i}
            <tr>
                <td>{count}</td>
                {#if trumps[i] === "♥" || trumps[i] === "♦"}
                    <td style="color:red">{trumps[i]}</td>
                {:else}
                    <td>{trumps[i]}</td>
                {/if}
                <td>{players[i%players.length]}</td>
                <td>{players[(i+1)%players.length]}</td>
                {#each players as player}
                    <td>
                        <div class="w-full flex divide-x divide-gray-300">
                            <span class="flex-1 text-center {predictions[player].met[i] ? "text-green-500" : ""}">{predictions[player].predictions[i] == null ? "" : predictions[player].predictions[i]}</span>
                            <span class="flex-1 text-center">{
                                predictions[player].totals[i] == null ? "" : predictions[player].totals[i]
                            } {
                                predictions[player].made[i] == null ? "" : `(${predictions[player].made[i]})`
                            }</span>
                        </div>
                    </td>
                {/each}
            </tr>
            {/each}
        </tbody>
    </table>
{:else if complete}
    <p>Game over.</p>
    <p>{getWinner()} is the winner!</p>
{:else}
    <label for="playerList">
        <span>Who is playing?</span>
        <textarea bind:value={playersIn} id="playerList" class="block border border-gray-300 mt-3" cols="40" rows="8"></textarea>
    </label>
    <button on:click={start} class="btn">Play</button>
{/if}

<style lang="postcss">
    .btn {
        @apply mt-1;
        @apply bg-blue-500;
        @apply text-white;
        @apply px-2;
        @apply py-1;
        @apply rounded-md;
    }

    td {
        @apply text-center;
        @apply border-l;
        @apply border-r;
        @apply border-gray-300;
    }

    tr {
        @apply border-b;
        @apply border-gray-300;
    }
</style>