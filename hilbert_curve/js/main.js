// https://github.com/golang/geo/blob/master/s2/cellid.go

let posToOrientation = [1, 0, 0, 3];
let posToIJ = [
    [0, 1, 3, 2], // canonical order:    (0,0), (0,1), (1,1), (1,0)
    [0, 2, 3, 1], // axes swapped:       (0,0), (1,0), (1,1), (0,1)
    [3, 2, 0, 1], // bits inverted:      (1,1), (1,0), (0,0), (0,1)
    [3, 1, 0, 2], // swapped & inverted: (1,1), (0,1), (0,0), (1,0)
];

let globalLevel = 0;
let globalCoords = [];
let globalPos = 0;


function initLookupCell(level, i, j, origOrientation, pos, orientation) {
    if (level == globalLevel) {
        // console.log("i, j is (%d, %d), pos is %d\n", i, j, pos)
        globalCoords[pos] = [i, j];
        return;
    }

    level++;
    i <<= 1;
    j <<= 1;
    pos <<= 2;

    // origOrientation 是 [1, 0, 0, 3]
    // orientation 表示当前的朝向
    // r 表示当前朝向下的绘制顺序
    // r[0]>>1 取出 i 位， r[0]&1 取出 j 位
    // orientation^posToOrientation[0] 表示下一层的朝向
    let r = posToIJ[orientation];
    initLookupCell(level, i + (r[0] >> 1), j + (r[0] & 1), origOrientation, pos, orientation ^ posToOrientation[0]);
    initLookupCell(level, i + (r[1] >> 1), j + (r[1] & 1), origOrientation, pos + 1, orientation ^ posToOrientation[1]);
    initLookupCell(level, i + (r[2] >> 1), j + (r[2] & 1), origOrientation, pos + 2, orientation ^ posToOrientation[2]);
    initLookupCell(level, i + (r[3] >> 1), j + (r[3] & 1), origOrientation, pos + 3, orientation ^ posToOrientation[3]);
}

let globalYOffset = 10;
function drawHilbertCurve(canvas, size, orientation, levelParam) {
    globalPos = 0;
    globalLevel = levelParam;
    globalCoords = [];

    let ctx = canvas.getContext('2d');
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, size, size);

    ctx.strokeStyle = 'red';
    ctx.fillStyle = 'red';
    ctx.lineWidth = 2;

    let N = (1 << levelParam);

    let blockSize = Math.floor(size / N);
    let offset = blockSize / 2;

    initLookupCell(0, 0, 0, orientation, 0, orientation);

    let prev = globalCoords[0];
    for (let i = 0; i < N * N; i++) {
        let color = 'hsl(' + Math.floor(i * 360 / (N * N)) + ', 100%, 60%)';
        ctx.strokeStyle = color;
        ctx.fillStyle = color;

        let curr = globalCoords[i];
        dot(curr);
        line(prev, curr);
        prev = curr;
    }

    for (let i = 0; i < N; i++) {
        ctx.fillStyle = 'white';

        axis(i, 0, i, offset, offset / 5);
        axis(0, i, i, offset / 10, offset);
    }

    function axis(x, y, value, xOffset, yOffset) {
        ctx.fillText(value, x * blockSize + xOffset, y * blockSize + yOffset + globalYOffset);
    }

    function dot(point) {
        let r = 4;
        let x = point[0], y = point[1];

        ctx.beginPath();
        ctx.arc(x * blockSize + offset, y * blockSize + offset + globalYOffset, r, 0, 2 * Math.PI);
        ctx.fill();

        if (levelParam >= 5) {
            ctx.font = "14px serif";
        } else if (levelParam == 4) {
            ctx.font = "20px serif";
        } else {
            ctx.font = "30px serif";
        }
        ctx.fillText(globalPos, x * blockSize + offset, y * blockSize + offset + globalYOffset);
        globalPos++;
    }

    function line(from, to) {
        ctx.beginPath();
        ctx.moveTo(from[0] * blockSize + offset, from[1] * blockSize + offset + globalYOffset);
        ctx.lineTo(to[0] * blockSize + offset, to[1] * blockSize + offset + globalYOffset);
        ctx.stroke();
    }
}
