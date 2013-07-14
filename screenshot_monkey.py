# Imports the monkeyrunner modules used by this program
from com.android.monkeyrunner import MonkeyRunner, MonkeyDevice
import sys, os

#Make Widnows behave
#if sys.platform == "win32":
#    import  msvcrt
#    msvcrt.setmode(sys.stdout.fileno(  ), os.O_BINARY)

	
sys.stdout = os.fdopen(sys.stdout.fileno(), 'wb', 0)
# Connects to the current device, returning a MonkeyDevice object
device = MonkeyRunner.waitForConnection()

# Takes a screenshot
result = device.takeSnapshot()

# Writes the screenshot to a stdout
res = result.convertToBytes('png')

#print res.__class__.__name__
#print res[0].__class__.__name__
#print res[0] + 128
for i in res:
	sys.stdout.write(chr((i+256)%256))
