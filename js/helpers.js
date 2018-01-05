Array.prototype.allValuesSame = function() {

    for(var i = 1; i < this.length; i++)
    {
        if(this[i] !== this[0])
            return false;
    }

    return true;
};

Array.prototype.getLargestNumber = function () {
    return Math.max.apply(null, this);
};